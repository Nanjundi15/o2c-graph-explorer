# SAP O2C Graph Explorer

A full-stack application that models SAP Order-to-Cash data as an interactive graph and provides an LLM-powered natural language query interface.

**Live Demo:** https://o2c-graph-explorer-61e3.vercel.app  
**Backend API:** https://o2c-graph-explorer-2.onrender.com  
**GitHub:** https://github.com/Nanjundi15/o2c-graph-explorer

---

## What It Does

- Ingests 18 SAP O2C entity types (Orders, Deliveries, Billing, Payments, etc.) into a structured database
- Visualizes them as an **interactive graph** — nodes represent entity types, edges represent business relationships
- Provides a **chat interface** where users ask questions in plain English
- The system translates questions into SQL, executes them, and returns **data-backed answers**
- Restricts all queries to the dataset — off-topic prompts are rejected

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (Vercel)                     │
│                                                         │
│   ┌──────────────────────┐  ┌────────────────────────┐  │
│   │  GraphView           │  │  ChatPanel             │  │
│   │  Cytoscape.js +      │  │  Natural language →    │  │
│   │  fCoSE layout        │  │  SQL → Answer          │  │
│   │  Dark/Light theme    │  │  History sidebar       │  │
│   └──────────────────────┘  └────────────────────────┘  │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS REST (/api/*)
┌──────────────────────────▼──────────────────────────────┐
│                   Backend (Render)                      │
│                                                         │
│   routes/graph.py  →  database.py  →  SQLite (o2c.db)  │
│   routes/chat.py   →  llm.py       →  Groq API         │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | React 18 + TypeScript | Type safety, component model, ecosystem |
| Styling | Tailwind CSS + CSS Variables | Utility-first, clean dark/light theme switching |
| Animations | Framer Motion | Production-grade animations, smooth transitions |
| Graph | Cytoscape.js + fCoSE layout | Best-in-class graph rendering, physics-based layout |
| Backend | FastAPI (Python) | Async, typed, auto-generates OpenAPI docs |
| Database | SQLite | Lightweight, zero-infra, perfect for 4,670 rows |
| LLM | Groq — Llama 3.3 70B | Free tier, 30 req/min, fastest inference available |
| Deployment | Render (backend) + Vercel (frontend) | Both free tier, automatic GitHub deploys |

---

## Database Design Decisions

### Why SQLite over PostgreSQL or Neo4j?

The dataset contains **4,670 rows** across 18 entity types — a small, read-heavy workload.

**SQLite advantages here:**
- Zero infrastructure — single `.db` file, no server to manage
- Sub-millisecond query performance at this scale
- Full SQL support — JOINs, CTEs, GROUP BY, window functions
- Native Python support via `sqlite3` standard library
- Portable — file can be committed to the repo, no migration scripts

**Why not PostgreSQL?**  
Postgres adds operational complexity (connection pooling, separate server, credentials) with zero performance benefit at this data size.

**Why not Neo4j?**  
Neo4j would require a running server, a separate query language (Cypher), and a driver dependency. The O2C relationships map cleanly to SQL JOINs — there are no deeply recursive graph traversals that would benefit from a native graph DB. The "graph" in this app is a visualization concern, not a storage concern.

### Schema Design

- **Flat table per entity** — no EAV (Entity-Attribute-Value). Every column is named, typed, and queryable
- **camelCase JSON → snake_case SQL** — Python convention, consistent throughout
- **Composite primary keys** where appropriate — prevents silent duplicates on re-ingestion
- **`INSERT OR IGNORE`** — makes `ingest.py` idempotent, safe to re-run
- **`product_storage_locations` excluded** — 16,723 bin-level inventory rows irrelevant to O2C flow queries, would add noise without value
- **WAL mode enabled** — allows concurrent reads while writing

### Key Foreign Key Relationships

```
sales_order_headers.sold_to_party           → business_partners.business_partner
sales_order_items.sales_order               → sales_order_headers.sales_order
sales_order_items.material                  → products.product
outbound_delivery_items.reference_sd_document → sales_order_headers.sales_order
outbound_delivery_items.delivery_document   → outbound_delivery_headers.delivery_document
outbound_delivery_items.plant               → plants.plant
billing_document_items.reference_sd_document → outbound_delivery_headers.delivery_document
billing_document_items.billing_document     → billing_document_headers.billing_document
billing_document_headers.accounting_document → journal_entry_items.accounting_document
journal_entry_items.reference_document      → billing_document_headers.billing_document
payments.accounting_document                → journal_entry_items.accounting_document
```

---

## Graph Modelling

### The O2C Flow

```
BusinessPartner (customer)
    │  soldToParty
    ▼
SalesOrderHeader
    │  salesOrder
    ▼
SalesOrderItem ──────────────────────────────→ Product
    │  referenceSdDocument
    ▼
OutboundDeliveryItem ────────────────────────→ Plant
    │  deliveryDocument
    ▼
OutboundDeliveryHeader
    │  referenceSdDocument (in billing items)
    ▼
BillingDocumentItem ─────────────────────────→ Product
    │  billingDocument
    ▼
BillingDocumentHeader
    │  accountingDocument
    ▼
JournalEntryItem
    │  clearingAccountingDocument
    ▼
Payment
```

### Two-Layer Graph

**Layer 1 — Overview graph** (initial load)  
One node per entity type. 11 nodes, 10 edges. Shows the O2C topology at a glance.

**Layer 2 — Expanded graph** (on click)  
Clicking an entity node fetches up to 12 individual records and renders them as child nodes using dashed edges. The fCoSE layout re-runs to accommodate the new nodes.

### Node Color Encoding

Each entity type has a distinct color that works in both dark and light mode via CSS variables:

| Entity | Color |
|--------|-------|
| Customer | Blue |
| Sales Order | Green |
| Delivery | Amber |
| Billing | Purple |
| Accounting | Cyan |
| Payment | Rose |
| Product | Lime |
| Plant | Teal |

---

## LLM Prompting Strategy

### Model

**Groq — Llama 3.3 70B Versatile**  
- Free tier: 30 requests/minute, 14,400 requests/day
- Chosen for fastest inference latency of any free provider
- OpenAI-compatible API — standard `httpx` POST, no SDK dependency

### Two-Pass Pipeline

**Pass 1 — Intent Classification + SQL Generation**

System prompt includes:
- Full live database schema (from `PRAGMA table_info`) — model knows exact column names
- All foreign key relationships spelled out in plain text
- Business context describing what each entity represents
- Strict output format: JSON only, no markdown, no prose

```
{
  "is_off_topic": false,
  "sql": "SELECT ...",
  "explanation": "one sentence describing what this query does"
}
```

Temperature: **0.1** — near-deterministic for consistent SQL output.

**Pass 2 — Natural Language Summary**

After SQL execution, results (capped at 15 rows for token efficiency) are passed back to the model with a summary prompt instructing it to:
- Answer in 2–4 sentences
- Use specific numbers from the data
- Not mention SQL or technical terms

This ensures the final answer is **always grounded in real query results** — the model cannot hallucinate numbers.

### Why Two Passes?

SQL generation and summarization have different optimal temperatures and different failure modes. Separating them means:
- A bad SQL generation doesn't corrupt the answer format
- If the second pass rate-limits, we gracefully return the data table with a basic answer
- Each pass can be debugged independently

### Rate Limit Handling

Groq free tier enforces a token-per-minute limit. The `llm.py` module implements:
- **Automatic retry** — up to 3 attempts on HTTP 429
- **Exponential backoff** — reads `Retry-After` header, caps wait at 60 seconds
- **Graceful degradation** — if all retries fail, returns a friendly message instead of crashing

---

## Guardrails

### Layer 1 — LLM Self-Classification

The system prompt instructs the model to set `"is_off_topic": true` for any question not about the O2C dataset. This handles:
- General knowledge ("What is the capital of France?")
- Creative writing ("Write me a poem")
- Coding help, weather, news, opinions
- Any topic not related to orders, deliveries, billing, or payments

Response shown to user:
> "This system is designed to answer questions related to the provided SAP O2C dataset only."

### Layer 2 — Code-Level SQL Guard

Before any SQL is executed, the backend checks:

```python
if not sql.strip().upper().startswith("SELECT"):
    return {"answer": "Only read queries are permitted."}
```

This prevents any INSERT, UPDATE, DELETE, DROP — even if the LLM were somehow manipulated into generating them.

### Layer 3 — Pydantic Input Validation

The `/api/chat/query` endpoint validates the request body:

```python
class ChatRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=1000)
```

Empty strings, single characters, and excessively long inputs are rejected before reaching the LLM.

### Layer 4 — Schema Isolation

The LLM only receives the schema for the O2C database. It has no knowledge of any other systems, credentials, or data sources. Even a prompt injection attack can only query the read-only SQLite file.

---

## Project Structure

```
.
├── backend/
│   ├── ingest.py         # One-time data loader: JSONL → SQLite
│   ├── database.py       # All SQL queries (routes never write raw SQL)
│   ├── llm.py            # Groq integration, two-pass pipeline, retry logic
│   ├── main.py           # FastAPI app entry point, CORS config
│   ├── routes/
│   │   ├── graph.py      # Graph endpoints (overview, entity, analytics)
│   │   └── chat.py       # Chat endpoint
│   ├── requirements.txt
│   ├── runtime.txt       # Pins Python 3.11.9 for Render
│   └── nixpacks.toml     # Render build: install → ingest → start
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                    # Root layout, theme management
│   │   ├── api.ts                     # Typed API client
│   │   ├── index.css                  # CSS variables for dark/light theme
│   │   ├── vite-env.d.ts              # Vite type declarations
│   │   ├── types/index.ts             # All TypeScript types
│   │   ├── hooks/
│   │   │   ├── useTheme.ts            # Dark/light toggle, localStorage persist
│   │   │   └── useChatHistory.ts      # Chat session storage, localStorage persist
│   │   └── components/
│   │       ├── GraphView.tsx          # Cytoscape graph, expand on click
│   │       ├── ChatPanel.tsx          # Chat UI, history sidebar
│   │       ├── EntityDrawer.tsx       # Slide-in record inspector
│   │       └── AnalyticsPanel.tsx     # Pre-built insights dashboard
│   ├── vercel.json
│   ├── package.json
│   └── vite.config.ts
│
├── data/
│   ├── o2c.db              # SQLite database (generated by ingest.py)
│   └── sap-o2c-data/       # Original JSONL source files
│
├── README.md
└── DEPLOY.md
```

---

## Running Locally

### Prerequisites
- Python 3.11+
- Node.js 18+
- Groq API key (free at https://console.groq.com)

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python ingest.py                 # Run once — loads data into SQLite
cp .env.example .env             # Add your GROQ_API_KEY
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

---

## Example Queries

| Query | What it does |
|-------|-------------|
| Which products have the most billing documents? | GROUP BY product, COUNT billing docs, JOIN product descriptions |
| Trace billing document 90504248 | Chain traversal: Billing → Delivery → Sales Order → Journal → Payment |
| Show orders delivered but not billed | LEFT JOIN gap analysis across delivery and billing tables |
| Which customers have the highest order value? | SUM net_amount GROUP BY sold_to_party JOIN business_partners |
| Find all cancelled billing documents | Filter billing_document_cancellations table |
| Write me a poem | ❌ Rejected — off-topic guardrail fires |

---

## Deployment

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | https://o2c-graph-explorer-61e3.vercel.app |
| Backend | Render | https://o2c-graph-explorer-2.onrender.com |

See `DEPLOY.md` for step-by-step deployment instructions.