"""
llm.py
------
LLM integration using Groq (free tier) — llama-3.3-70b-versatile.

Free tier limits: 30 req/min, 6,000 tokens/min, 14,400 req/day
This file handles rate limit errors gracefully with automatic retry + backoff.

Get your free key at: https://console.groq.com
"""

import asyncio
import json
import os
import re
import textwrap
from typing import Any

import httpx
from database import execute_query, get_schema_description

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL   = "llama-3.3-70b-versatile"

MAX_RETRIES  = 3          # Retry up to 3 times on rate limit
RETRY_DELAY  = 15         # Wait 15 seconds between retries


# ---------------------------------------------------------------------------
# Prompt construction
# ---------------------------------------------------------------------------

def build_system_prompt() -> str:
    schema = get_schema_description()
    return textwrap.dedent(f"""
        You are a data analyst assistant for a SAP Order-to-Cash (O2C) dataset.
        You answer questions ONLY about this dataset. You do not answer general
        knowledge questions, write creative content, or discuss topics outside
        this business data.

        DATASET CONTEXT
        ---------------
        This is a SAP O2C dataset covering the full business flow:
          Sales Order → Outbound Delivery → Billing Document → Journal Entry → Payment

        All amounts are in INR. Company code is ABCD.

        {schema}

        KEY RELATIONSHIPS
        -----------------
        - sales_order_headers.sold_to_party              → business_partners.business_partner
        - sales_order_items.sales_order                  → sales_order_headers.sales_order
        - sales_order_items.material                     → products.product
        - outbound_delivery_items.reference_sd_document  → sales_order_headers.sales_order
        - outbound_delivery_items.delivery_document      → outbound_delivery_headers.delivery_document
        - outbound_delivery_items.plant                  → plants.plant
        - billing_document_items.reference_sd_document   → outbound_delivery_headers.delivery_document
        - billing_document_items.billing_document        → billing_document_headers.billing_document
        - billing_document_headers.accounting_document   → journal_entry_items.accounting_document
        - journal_entry_items.reference_document         → billing_document_headers.billing_document
        - payments.accounting_document                   → journal_entry_items.accounting_document

        INSTRUCTIONS
        ------------
        1. Decide if the question is about this O2C dataset. If NOT, set is_off_topic=true.
        2. If on-topic, write a valid SQLite SELECT query to answer it.
        3. Use JOINs across tables when needed. Use product_descriptions for human-readable names.
        4. Respond ONLY with a valid JSON object — no markdown, no prose outside JSON:

        {{
          "is_off_topic": false,
          "sql": "SELECT ...",
          "explanation": "one sentence describing what this query does"
        }}

        If off-topic:
        {{
          "is_off_topic": true,
          "sql": null,
          "explanation": "This system is designed to answer questions related to the provided SAP O2C dataset only."
        }}
    """).strip()


# ---------------------------------------------------------------------------
# Groq API call with retry on rate limit
# ---------------------------------------------------------------------------

async def call_groq(system: str, user: str) -> str:
    """
    Call Groq chat completions with automatic retry on 429 rate limit.
    Waits RETRY_DELAY seconds between attempts.
    """
    if not GROQ_API_KEY:
        raise ValueError(
            "GROQ_API_KEY is not set. "
            "Get a free key at https://console.groq.com and add it to backend/.env"
        )

    payload = {
        "model":    GROQ_MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ],
        "temperature": 0.1,
        "max_tokens":  1024,
    }

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type":  "application/json",
    }

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(GROQ_URL, json=payload, headers=headers)

            if resp.status_code == 429:
                # Rate limited — extract retry-after if available
                retry_after = int(resp.headers.get("retry-after", RETRY_DELAY))
                wait = min(retry_after, 60)   # Cap at 60s
                if attempt < MAX_RETRIES:
                    await asyncio.sleep(wait)
                    continue
                else:
                    raise ValueError(
                        f"Rate limit reached after {MAX_RETRIES} attempts. "
                        f"Please wait {wait} seconds and try again. "
                        f"(Groq free tier: 6,000 tokens/min)"
                    )

            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]

        except httpx.TimeoutException:
            if attempt < MAX_RETRIES:
                await asyncio.sleep(5)
                continue
            raise ValueError("Request timed out. Please try again.")

        except httpx.HTTPStatusError as e:
            # Non-429 HTTP errors — don't retry
            raise ValueError(f"Groq API error {e.response.status_code}: {e.response.text[:200]}")

    raise ValueError("All retry attempts failed.")


# ---------------------------------------------------------------------------
# JSON parser
# ---------------------------------------------------------------------------

def _parse_llm_json(raw: str) -> dict[str, Any]:
    """Extract JSON from LLM response, stripping any markdown fences."""
    cleaned = re.sub(r"```(?:json)?", "", raw).replace("```", "").strip()
    return json.loads(cleaned)


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

async def answer_question(question: str) -> dict[str, Any]:
    """
    Full two-pass pipeline:
    1. Groq classifies intent + generates SQL
    2. SQL executed against SQLite
    3. Groq summarizes results in plain English

    Returns a structured response dict consumed by the chat route.
    """
    system_prompt = build_system_prompt()

    # ── Pass 1: intent classification + SQL generation ────────────────────
    try:
        raw = await call_groq(system_prompt, f"User question: {question}")
    except ValueError as e:
        return {
            "answer":       str(e),
            "sql":          None,
            "data":         [],
            "is_off_topic": False,
        }

    try:
        parsed = _parse_llm_json(raw)
    except (json.JSONDecodeError, KeyError):
        return {
            "answer":       "I had trouble understanding that. Please try rephrasing.",
            "sql":          None,
            "data":         [],
            "is_off_topic": False,
        }

    # ── Guardrail: off-topic ──────────────────────────────────────────────
    if parsed.get("is_off_topic"):
        return {
            "answer": parsed.get(
                "explanation",
                "This system is designed to answer questions related to the provided dataset only."
            ),
            "sql":          None,
            "data":         [],
            "is_off_topic": True,
        }

    sql = parsed.get("sql", "").strip()
    if not sql:
        return {
            "answer":       "Could not generate a query for that question.",
            "sql":          None,
            "data":         [],
            "is_off_topic": False,
        }

    # ── Guardrail: only SELECT queries ────────────────────────────────────
    if not sql.strip().upper().startswith("SELECT"):
        return {
            "answer":       "Only read queries are permitted.",
            "sql":          sql,
            "data":         [],
            "is_off_topic": False,
        }

    # ── Execute SQL ───────────────────────────────────────────────────────
    try:
        data = execute_query(sql)
    except Exception as exc:
        return {
            "answer":       f"Query execution failed: {exc}",
            "sql":          sql,
            "data":         [],
            "is_off_topic": False,
        }

    if not data:
        return {
            "answer":       "The query returned no results for your question.",
            "sql":          sql,
            "data":         [],
            "is_off_topic": False,
        }

    # ── Pass 2: natural language summary grounded in real data ────────────
    data_preview = json.dumps(data[:15], indent=2)   # Keep tokens low
    summary_prompt = textwrap.dedent(f"""
        The user asked: "{question}"

        The SQL returned {len(data)} rows. First results:
        {data_preview}

        Write a clear answer in 2-4 sentences using specific numbers from the data.
        Do not mention SQL or technical terms.
    """).strip()

    try:
        summary = await call_groq(
            "You are a helpful data analyst. Be concise and use the numbers from the data.",
            summary_prompt,
        )
    except ValueError as e:
        # If second call rate-limits, return data with a basic answer
        summary = f"Query returned {len(data)} rows. See the data table below for details."

    return {
        "answer":       summary.strip(),
        "sql":          sql,
        "data":         data[:100],
        "row_count":    len(data),
        "is_off_topic": False,
    }