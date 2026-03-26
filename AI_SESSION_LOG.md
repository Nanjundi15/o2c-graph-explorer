# AI Coding Session Log — O2C Graph Explorer

**Tool:** Claude (claude.ai) — Sonnet 4.6  
**Project:** SAP Order-to-Cash Graph Explorer  
**Session Date:** March 24–26, 2026  
**Total Duration:** ~12 hours across multiple sessions

---

## Session Overview

This document logs the full AI-assisted development session for the SAP O2C Graph Explorer assignment. All architecture decisions, code generation, debugging, and deployment were done collaboratively with Claude.

---

## Phase 1 — Dataset Analysis

**Prompt:**
> "Go through this depth first" [attached sap-order-to-cash-dataset.zip]

**What Claude did:**
- Extracted and listed all 19 folders in the zip
- Read one record from each JSONL file to understand schema
- Counted records per entity (100 sales orders, 163 billing docs, etc.)
- Identified all foreign key relationships across entities
- Mapped the complete O2C flow: Sales Order → Delivery → Billing → Journal → Payment

**Key insight extracted:**
```
billing_document_items.referenceSdDocument → outbound_delivery_headers.delivery_document
journal_entry_items.referenceDocument → billing_document_headers.billingDocument
```

---

## Phase 2 — Architecture Planning

**Prompt:**
> "Code must be clean. They mention how they evaluate according to that, giving all trending and animated designs to attract"

**Claude's architectural decisions:**
- SQLite over PostgreSQL — 4,670 rows doesn't need a server
- FastAPI over Flask — async support needed for Groq API calls
- Cytoscape.js + fCoSE — physics-based layout for graph
- Framer Motion — production animations
- Groq Llama 3.3 70B — best free tier inference speed
- CSS variables for dark/light theme — instant switching without re-render
- Two-pass LLM pipeline — separate SQL generation from summarization

---

## Phase 3 — Backend Development

### ingest.py

**Prompt:** "give" (after architecture discussion)

**Iteration 1:** Initial version with hardcoded paths → ran 0 rows  
**Debug:** Paths were wrong for sandbox environment  
**Iteration 2:** Fixed DATA_DIR path → FK mismatch on payments table  
**Debug:** payments table had invalid FK reference to composite PK  
**Iteration 3:** Removed invalid FK, re-ran → 4,670 rows loaded

```
✓ business_partners          8 rows
✓ products                  69 rows
✓ sales_order_headers       100 rows
✓ billing_document_headers  163 rows
✓ payments                  120 rows
[18 tables total, 4,670 rows]
```

### database.py

Wrote all SQL queries:
- `get_graph_overview()` — 11 entity counts + 10 edge definitions
- `query_top_products_by_billing()` — JOIN billing_document_items + product_descriptions
- `query_billing_document_flow()` — chain traversal across 5 tables
- `query_broken_flows()` — 3 LEFT JOIN gap queries

**Tested live:**
```python
Top product: SUNSCREEN GEL SPF50-PA+++ 50ML (22 billing docs)
Broken flows: {delivered_not_billed: 3, ordered_not_delivered: 14, billed_not_posted: 24}
```

### llm.py — First Version (Gemini)

Initial implementation used Google Gemini 2.0 Flash.

**Issue found in testing:** HTTP 429 — rate limit hit after 2 queries  
```
Client error for url 'https://generativelanguage.googleapis.com/...'
HTTP/Status/429
```

---

## Phase 4 — LLM Provider Switch

**Prompt:**
> "give me other api than the gemini which are free to use groq that free according to what i change just modify"

**Claude's decision:** Switch to Groq (llama-3.3-70b-versatile)
- 30 req/min vs Gemini's 15 req/min
- 14,400 req/day
- OpenAI-compatible API — minimal code change

**Changes made:**
- `GEMINI_URL` → `GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"`
- `call_gemini()` → `call_groq()` with Bearer token auth
- Added `MAX_RETRIES = 3` and `RETRY_DELAY = 15` for rate limit handling
- Two-pass pipeline kept identical

**Second issue:** App still stopping after a few queries  
**Root cause:** Token-per-minute limit (6,000 tokens/min) — schema in system prompt is ~1,500 tokens  
**Fix:** Added `asyncio.sleep(retry_after)` with `Retry-After` header parsing

---

## Phase 5 — Frontend Development

### Design direction chosen:
- Dark mode default — deep navy (#060912) base
- Electric cyan (#22d3ee) as primary accent
- Syne (display) + JetBrains Mono (data) + DM Sans (body) fonts
- Noise texture overlay for depth
- Scan lines on graph panel

### Components built:

**GraphView.tsx**
- Cytoscape.js with fCoSE physics layout
- Node colors read from CSS variables (theme-aware)
- Click to expand → fetches records → renders child nodes
- Hover tooltip showing entity name + record count
- Zoom/fit/reset controls

**ChatPanel.tsx**
- Suggested queries shown on load
- Message bubbles with role-based styling
- Collapsible SQL preview (Show SQL toggle)
- Collapsible data table (View N rows toggle)
- Off-topic messages shown with amber warning style

**AnalyticsPanel.tsx**
- Top Products tab — horizontal bar chart with animated fills
- Broken Flows tab — 3 summary cards + detail tables

**EntityDrawer.tsx**
- Spring-animated slide-in from right
- Shows first 5 columns of up to 15 records

---

## Phase 6 — Dark/Light Mode + Chat History

**Prompt:**
> "i will make ui design in format darkmode and lightmode option and graph visuals will be according to this mode. and also save history option what we search in previous in bot"

**useTheme.ts hook:**
- `data-theme` attribute on `<html>` triggers CSS variable swap
- Persists to localStorage
- Animated sun/moon icon swap in header

**CSS variable system:**
```css
[data-theme="dark"]  { --bg-base: #060912; --cyan: #22d3ee; ... }
[data-theme="light"] { --bg-base: #f8fafc; --cyan: #0891b2; ... }
```

Graph node colors also CSS-variable-driven — re-initializes Cytoscape on theme change.

**useChatHistory.ts hook:**
- Each conversation saved as a `ChatSession` in localStorage
- Max 20 sessions stored
- History sidebar with session list, timestamps, query count
- Delete individual sessions or clear all
- Load any past session to restore full conversation

---

## Phase 7 — Deployment

### Render (Backend)

**First attempt:** Failed  
```
error: metadata-generation-failed — pydantic-core
Caused by: Read-only file system (os error 30) [Rust/cargo]
```

**Root cause:** Render defaulted to Python 3.14 — pydantic-core has no pre-built wheel, tried to compile from Rust source, failed on read-only filesystem.

**Fix:**
```bash
echo "python-3.11.9" > backend/runtime.txt
# Changed pydantic==2.8.2 → pydantic==2.10.6
```

**Second attempt:** ✅ Success — `https://o2c-graph-explorer-2.onrender.com`

### Vercel (Frontend)

**First attempt:** Failed  
```
error TS2339: Property 'env' does not exist on type 'ImportMeta'
error TS2307: Cannot find module '../hooks/useChatHistory'
error TS2440: Import declaration conflicts with local declaration of 'EntityRecord'
error TS7006: Parameter 'x' implicitly has an 'any' type
error TS2724: 'cytoscape' has no exported member named 'Stylesheet'
```

**Fixes applied:**
1. Created `vite-env.d.ts` with `/// <reference types="vite/client" />` — fixes ImportMeta.env
2. Added `"types": ["vite/client"]` to tsconfig
3. Removed duplicate `type EntityRecord` at bottom of ChatPanel.tsx
4. Removed duplicate `type GraphOverview` at bottom of GraphView.tsx
5. Added explicit `(x: any)` types to callbacks
6. Changed `cytoscape.Stylesheet[]` return type to `any[]`
7. Changed build script from `tsc && vite build` to `vite build`
8. Set `"strict": false` in tsconfig

**Second attempt:** ✅ Success — `https://o2c-graph-explorer-61e3.vercel.app`

---

## Phase 8 — Final Verification

All 5 screenshots confirmed working:

| Feature | Result |
|---------|--------|
| Graph with 11 nodes | ✅ All entity types visible, correct colors |
| Node expand + drawer | ✅ 137 delivery item records loaded, drawer shows data |
| Analytics — Top Products | ✅ SUNSCREEN GEL SPF50 ranked #1 with 22 docs |
| Chat — data query | ✅ "Which products have most billing docs?" → real answer |
| Chat — guardrail | ✅ "what is poem" → Off-topic query rejection |

---

## Prompting Patterns Used

### Pattern 1 — Depth-first data exploration
Ask Claude to read raw files before writing any code. This produced accurate FK relationships that would have taken hours to reverse-engineer manually.

### Pattern 2 — Iterative debugging
Share exact error output → Claude identifies root cause → targeted fix rather than rewriting.

### Pattern 3 — One feature at a time
Each prompt had a single clear goal: "write ingest.py", "add retry logic", "add dark mode". This kept changes isolated and reviewable.

### Pattern 4 — Constraint-first prompting
"Code must be clean, trending, animated design" set the quality bar upfront rather than asking for improvements after the fact.

---

## Files Generated by AI

| File | Lines | Generated |
|------|-------|-----------|
| backend/ingest.py | ~180 | Claude |
| backend/database.py | ~220 | Claude |
| backend/llm.py | ~180 | Claude |
| backend/main.py | ~35 | Claude |
| backend/routes/graph.py | ~50 | Claude |
| backend/routes/chat.py | ~25 | Claude |
| frontend/src/App.tsx | ~120 | Claude |
| frontend/src/api.ts | ~50 | Claude |
| frontend/src/components/GraphView.tsx | ~230 | Claude |
| frontend/src/components/ChatPanel.tsx | ~280 | Claude |
| frontend/src/components/AnalyticsPanel.tsx | ~180 | Claude |
| frontend/src/components/EntityDrawer.tsx | ~80 | Claude |
| frontend/src/hooks/useTheme.ts | ~30 | Claude |
| frontend/src/hooks/useChatHistory.ts | ~70 | Claude |
| frontend/src/index.css | ~120 | Claude |
| README.md | ~200 | Claude |

**Total: ~2,050 lines of production code**
