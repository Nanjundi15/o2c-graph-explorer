# SAP O2C Graph Explorer

An interactive graph visualization and LLM-powered query interface for SAP Order-to-Cash data.

![Screenshot placeholder](./docs/screenshot.png)

---

## Architecture

```
┌────────────────────────────────────────────────────────┐
│                      Frontend (React)                  │
│  ┌────────────────────┐   ┌───────────────────────┐    │
│  │  GraphView         │   │  ChatPanel            │    │
│  │  Cytoscape.js      │   │  Natural language     │    │
│  │  Animated nodes    │   │  → SQL → Answer       │    │
│  └────────────────────┘   └───────────────────────┘    │
└───────────────────────┬────────────────────────────────┘
                        │ REST API (/api/*)
┌───────────────────────▼────────────────────────────────┐
│                   Backend (FastAPI)                    │
│  routes/graph.py  ──→  database.py  ──→  SQLite        │
│  routes/chat.py   ──→  llm.py       ──→  Gemini API    │
└────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | React 18 + TypeScript | Type safety, component model |
| Styling | Tailwind CSS + Framer Motion | Utility-first + production animations |
| Graph viz | Cytoscape.js + fCoSE layout | Best-in-class graph rendering for React |
| Backend | FastAPI (Python) | Async, typed, auto-docs, minimal boilerplate |
| Database | SQLite | ~4k rows, no infra, portable, read-heavy |
| In-memory graph | Cytoscape.js | Fast traversal, no separate graph DB needed |
| LLM | Google Gemini 2.0 Flash | Free tier, strong SQL generation, 15 RPM |

---

## Database Design Decisions

**Why SQLite over Postgres or Neo4j?**

The dataset contains ~4,670 rows across 18 entity types. SQLite provides:
- Zero infrastructure — single `.db` file, portable, instant setup
- Sub-millisecond query performance at this scale
- Full SQL including JOINs, CTEs, and window functions
- Native Python support via `sqlite3` standard library

Postgres would add operational complexity with no performance benefit.
Neo4j would require a running server and a separate query language (Cypher),
adding complexity without meaningfully improving O2C traversal queries that
map cleanly to SQL JOINs.

**Schema design:**
- Flat table per entity (no EAV) — SQL queries remain readable
- camelCase JSON keys → snake_case columns (Python convention)
- Composite PKs where appropriate to prevent silent duplicates
- `INSERT OR IGNORE` for idempotent re-ingestion
- `product_storage_locations` excluded (16k bin-level inventory rows,
  irrelevant to O2C flow queries, would dominate the DB)

---

## Graph Modelling

The O2C flow is modelled as a directed graph:

```
BusinessPartner (soldToParty)
    │
    ▼
SalesOrderHeader
    │
    ▼
SalesOrderItem ──→ Product
    │
    ▼ (referenceSdDocument)
OutboundDeliveryItem ──→ Plant
    │
    ▼
OutboundDeliveryHeader
    │
    ▼ (referenceSdDocument)
BillingDocumentItem ──→ Product
    │
    ▼
BillingDocumentHeader
    │
    ▼ (accountingDocument)
JournalEntryItem
    │
    ▼ (clearingAccountingDocument)
Payment
```

**Node types** represent business entities. **Edges** represent FK relationships.
The graph is built in two layers:
1. **Overview graph** — one node per entity type, shows the O2C topology
2. **Expanded graph** — clicking a node reveals individual records as child nodes

---

## LLM Prompting Strategy

The system uses a **two-pass prompting pipeline**:

### Pass 1 — Intent classification + SQL generation

System prompt includes:
- Full live schema (from `PRAGMA table_info`)
- All FK relationships spelled out
- Business context (what each entity represents)
- Strict JSON-only output format: `{is_off_topic, sql, explanation}`
- Temperature: 0.1 (deterministic SQL output)

### Pass 2 — Natural language summary

After SQL execution, results are passed back to Gemini with a summary prompt.
The model is instructed to answer in 2-4 sentences using specific numbers.
This ensures the answer is grounded in real data, not hallucinated.

### Why this works better than one-pass:
- SQL generation and summarization have different optimal temperatures
- Results are always data-backed — the model cannot fabricate numbers
- Failures are isolated: a bad SQL doesn't corrupt the answer template

---

## Guardrails

**Layer 1 — LLM self-classification:**
The system prompt instructs Gemini to set `is_off_topic: true` for any
question not about the O2C dataset. This handles: general knowledge,
creative writing, coding help, weather, etc.

**Layer 2 — Code-level SQL guard:**
Before execution, the backend checks `sql.upper().startswith("SELECT")`.
Only read queries are permitted — no INSERT, UPDATE, DELETE, DROP.

**Layer 3 — Pydantic validation:**
The chat endpoint validates `question` length (3–1000 chars) via Pydantic,
rejecting empty or excessively long inputs before they reach the LLM.

**Example guardrail response:**
```
User: "Write me a poem about autumn"
System: "This system is designed to answer questions related to the 
         provided SAP O2C dataset only."
```

---

## Setup & Running

### Prerequisites
- Python 3.11+
- Node.js 18+
- Google Gemini API key (free at https://ai.google.dev)

### Backend

```bash
cd backend
pip install -r requirements.txt

# Load data (run once)
python ingest.py

# Start API
GEMINI_API_KEY=your_key_here uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

---

## Example Queries

The system can answer all three example queries from the spec:

```
a. "Which products are associated with the highest number of billing documents?"
   → Uses analytics endpoint + LLM summarization

b. "Trace the full flow of billing document 90504248"
   → Chain traversal: Sales Order → Delivery → Billing → Journal → Payment

c. "Show me orders that were delivered but not billed"
   → LEFT JOIN gap analysis across delivery and billing tables
```

---

## Project Structure

```
.
├── backend/
│   ├── ingest.py        # Data loader — JSONL → SQLite
│   ├── database.py      # All SQL queries
│   ├── llm.py           # Gemini integration + prompting
│   ├── main.py          # FastAPI app
│   ├── routes/
│   │   ├── graph.py     # Graph endpoints
│   │   └── chat.py      # Chat endpoint
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx               # Root layout
│   │   ├── api.ts                # API client
│   │   ├── types/index.ts        # TypeScript types
│   │   └── components/
│   │       ├── GraphView.tsx     # Cytoscape graph
│   │       ├── ChatPanel.tsx     # Chat interface
│   │       ├── EntityDrawer.tsx  # Node detail drawer
│   │       └── AnalyticsPanel.tsx # Pre-built insights
│   └── package.json
├── data/
│   └── o2c.db           # SQLite database (generated by ingest.py)
└── README.md
```
