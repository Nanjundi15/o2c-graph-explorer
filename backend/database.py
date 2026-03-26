"""
database.py
-----------
Database access layer. All SQL lives here — routes never touch raw SQL.

Design:
- Single connection factory with WAL mode and row_factory for dict results
- Each function is a named, documented query — easy to read, easy to test
- get_schema_description() powers the LLM system prompt with live table info
"""

import sqlite3
from pathlib import Path
from typing import Any

import os
DB_PATH = Path(os.getenv("DB_PATH", Path(__file__).parent.parent / "data" / "o2c.db"))


# ---------------------------------------------------------------------------
# Connection
# ---------------------------------------------------------------------------

def get_connection() -> sqlite3.Connection:
    """Return a connection with dict-style row access and FK enforcement."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn


def rows_to_dicts(rows: list[sqlite3.Row]) -> list[dict[str, Any]]:
    return [dict(row) for row in rows]


# ---------------------------------------------------------------------------
# Schema introspection  (used to build LLM system prompt)
# ---------------------------------------------------------------------------

def get_schema_description() -> str:
    """
    Return a concise, LLM-readable description of every table and its columns.
    This is injected into the system prompt so the model knows the exact schema.
    """
    conn = get_connection()
    tables = rows_to_dicts(
        conn.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").fetchall()
    )

    lines = ["SQLite database schema (SAP Order-to-Cash):\n"]
    for t in tables:
        table_name = t["name"]
        cols = rows_to_dicts(conn.execute(f"PRAGMA table_info({table_name})").fetchall())
        col_defs = ", ".join(f"{c['name']} ({c['type'] or 'TEXT'})" for c in cols)
        lines.append(f"  {table_name}: {col_defs}")

    conn.close()
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Generic query executor  (used by the LLM route)
# ---------------------------------------------------------------------------

def execute_query(sql: str) -> list[dict[str, Any]]:
    """
    Execute an arbitrary SELECT query and return results as list of dicts.
    Raises ValueError for non-SELECT statements (safety guard).
    """
    stripped = sql.strip().upper()
    if not stripped.startswith("SELECT"):
        raise ValueError("Only SELECT queries are permitted.")

    conn = get_connection()
    try:
        rows = conn.execute(sql).fetchall()
        return rows_to_dicts(rows)
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Graph data queries  (used by the graph visualization route)
# ---------------------------------------------------------------------------

def get_graph_overview() -> dict[str, Any]:
    """
    Return a lightweight graph: one node per entity type with counts,
    plus edges representing the O2C relationships.
    Used for the initial graph render before any node is expanded.
    """
    conn = get_connection()

    counts = {
        "business_partners":            conn.execute("SELECT COUNT(*) FROM business_partners").fetchone()[0],
        "sales_order_headers":          conn.execute("SELECT COUNT(*) FROM sales_order_headers").fetchone()[0],
        "sales_order_items":            conn.execute("SELECT COUNT(*) FROM sales_order_items").fetchone()[0],
        "outbound_delivery_headers":    conn.execute("SELECT COUNT(*) FROM outbound_delivery_headers").fetchone()[0],
        "outbound_delivery_items":      conn.execute("SELECT COUNT(*) FROM outbound_delivery_items").fetchone()[0],
        "billing_document_headers":     conn.execute("SELECT COUNT(*) FROM billing_document_headers").fetchone()[0],
        "billing_document_items":       conn.execute("SELECT COUNT(*) FROM billing_document_items").fetchone()[0],
        "journal_entry_items":          conn.execute("SELECT COUNT(*) FROM journal_entry_items").fetchone()[0],
        "payments":                     conn.execute("SELECT COUNT(*) FROM payments").fetchone()[0],
        "products":                     conn.execute("SELECT COUNT(*) FROM products").fetchone()[0],
        "plants":                       conn.execute("SELECT COUNT(*) FROM plants").fetchone()[0],
    }
    conn.close()

    nodes = [
        {"id": k, "label": k.replace("_", " ").title(), "count": v, "type": k}
        for k, v in counts.items()
    ]

    # O2C flow edges
    edges = [
        {"source": "business_partners",         "target": "sales_order_headers",       "label": "places"},
        {"source": "sales_order_headers",        "target": "sales_order_items",         "label": "has items"},
        {"source": "sales_order_items",          "target": "products",                  "label": "for product"},
        {"source": "sales_order_headers",        "target": "outbound_delivery_items",   "label": "fulfilled by"},
        {"source": "outbound_delivery_items",    "target": "outbound_delivery_headers", "label": "part of"},
        {"source": "outbound_delivery_items",    "target": "plants",                    "label": "ships from"},
        {"source": "outbound_delivery_headers",  "target": "billing_document_items",    "label": "billed via"},
        {"source": "billing_document_items",     "target": "billing_document_headers",  "label": "part of"},
        {"source": "billing_document_headers",   "target": "journal_entry_items",       "label": "posts to"},
        {"source": "journal_entry_items",        "target": "payments",                  "label": "cleared by"},
    ]

    return {"nodes": nodes, "edges": edges}


def get_entity_records(entity: str, limit: int = 50) -> list[dict[str, Any]]:
    """Fetch up to `limit` records from the given entity table."""
    allowed = {
        "business_partners", "sales_order_headers", "sales_order_items",
        "outbound_delivery_headers", "outbound_delivery_items",
        "billing_document_headers", "billing_document_items",
        "billing_document_cancellations", "journal_entry_items",
        "payments", "products", "product_descriptions", "plants",
    }
    if entity not in allowed:
        raise ValueError(f"Unknown entity: {entity}")

    conn = get_connection()
    rows = conn.execute(f"SELECT * FROM {entity} LIMIT ?", (limit,)).fetchall()
    conn.close()
    return rows_to_dicts(rows)


def get_record_detail(entity: str, record_id: str) -> dict[str, Any] | None:
    """
    Fetch a single record plus its related records across the O2C chain.
    Returns a dict with the primary record and a 'related' dict of linked records.
    """
    conn = get_connection()
    result: dict[str, Any] = {}

    if entity == "sales_order_headers":
        row = conn.execute(
            "SELECT * FROM sales_order_headers WHERE sales_order = ?", (record_id,)
        ).fetchone()
        if not row:
            return None
        result["record"] = dict(row)
        result["related"] = {
            "items": rows_to_dicts(
                conn.execute(
                    "SELECT * FROM sales_order_items WHERE sales_order = ?", (record_id,)
                ).fetchall()
            ),
            "deliveries": rows_to_dicts(
                conn.execute(
                    """SELECT odh.* FROM outbound_delivery_headers odh
                       JOIN outbound_delivery_items odi
                         ON odh.delivery_document = odi.delivery_document
                      WHERE odi.reference_sd_document = ?""",
                    (record_id,)
                ).fetchall()
            ),
            "billings": rows_to_dicts(
                conn.execute(
                    """SELECT bdh.* FROM billing_document_headers bdh
                       JOIN billing_document_items bdi
                         ON bdh.billing_document = bdi.billing_document
                       JOIN outbound_delivery_headers odh
                         ON bdi.reference_sd_document = odh.delivery_document
                       JOIN outbound_delivery_items odi
                         ON odh.delivery_document = odi.delivery_document
                      WHERE odi.reference_sd_document = ?""",
                    (record_id,)
                ).fetchall()
            ),
        }

    elif entity == "billing_document_headers":
        row = conn.execute(
            "SELECT * FROM billing_document_headers WHERE billing_document = ?", (record_id,)
        ).fetchone()
        if not row:
            return None
        result["record"] = dict(row)
        result["related"] = {
            "items": rows_to_dicts(
                conn.execute(
                    "SELECT * FROM billing_document_items WHERE billing_document = ?", (record_id,)
                ).fetchall()
            ),
            "journal_entries": rows_to_dicts(
                conn.execute(
                    "SELECT * FROM journal_entry_items WHERE reference_document = ?", (record_id,)
                ).fetchall()
            ),
            "payments": rows_to_dicts(
                conn.execute(
                    """SELECT p.* FROM payments p
                       JOIN journal_entry_items j
                         ON p.accounting_document = j.accounting_document
                      WHERE j.reference_document = ?""",
                    (record_id,)
                ).fetchall()
            ),
        }

    else:
        # Generic single-record fetch for other entities
        pk_col = {
            "outbound_delivery_headers": "delivery_document",
            "products":                  "product",
            "plants":                    "plant",
            "business_partners":         "business_partner",
        }.get(entity)
        if pk_col:
            row = conn.execute(
                f"SELECT * FROM {entity} WHERE {pk_col} = ?", (record_id,)
            ).fetchone()
            result["record"] = dict(row) if row else None
            result["related"] = {}

    conn.close()
    return result if result else None


# ---------------------------------------------------------------------------
# Pre-built analytical queries  (answers the 3 example questions)
# ---------------------------------------------------------------------------

def query_top_products_by_billing() -> list[dict[str, Any]]:
    """Products associated with the highest number of billing documents."""
    conn = get_connection()
    rows = conn.execute("""
        SELECT
            bdi.material                        AS product_id,
            COALESCE(pd.product_description, bdi.material) AS product_name,
            COUNT(DISTINCT bdi.billing_document) AS billing_document_count,
            SUM(bdi.net_amount)                 AS total_billed_amount,
            bdi.transaction_currency            AS currency
        FROM billing_document_items bdi
        LEFT JOIN product_descriptions pd
               ON bdi.material = pd.product
              AND pd.language = 'EN'
        GROUP BY bdi.material
        ORDER BY billing_document_count DESC
        LIMIT 20
    """).fetchall()
    conn.close()
    return rows_to_dicts(rows)


def query_billing_document_flow(billing_doc_id: str) -> dict[str, Any]:
    """Trace the full O2C flow for a given billing document."""
    conn = get_connection()

    billing = rows_to_dicts(
        conn.execute(
            "SELECT * FROM billing_document_headers WHERE billing_document = ?",
            (billing_doc_id,)
        ).fetchall()
    )
    if not billing:
        conn.close()
        return {"error": f"Billing document {billing_doc_id} not found"}

    billing_items = rows_to_dicts(
        conn.execute(
            "SELECT * FROM billing_document_items WHERE billing_document = ?",
            (billing_doc_id,)
        ).fetchall()
    )

    delivery_ids = list({item["reference_sd_document"] for item in billing_items if item.get("reference_sd_document")})

    deliveries = rows_to_dicts(
        conn.execute(
            f"SELECT * FROM outbound_delivery_headers WHERE delivery_document IN ({','.join('?'*len(delivery_ids))})",
            delivery_ids
        ).fetchall()
    ) if delivery_ids else []

    delivery_items = rows_to_dicts(
        conn.execute(
            f"SELECT * FROM outbound_delivery_items WHERE delivery_document IN ({','.join('?'*len(delivery_ids))})",
            delivery_ids
        ).fetchall()
    ) if delivery_ids else []

    sales_order_ids = list({item["reference_sd_document"] for item in delivery_items if item.get("reference_sd_document")})

    sales_orders = rows_to_dicts(
        conn.execute(
            f"SELECT * FROM sales_order_headers WHERE sales_order IN ({','.join('?'*len(sales_order_ids))})",
            sales_order_ids
        ).fetchall()
    ) if sales_order_ids else []

    journal_entries = rows_to_dicts(
        conn.execute(
            "SELECT * FROM journal_entry_items WHERE reference_document = ?",
            (billing_doc_id,)
        ).fetchall()
    )

    accounting_docs = list({j["accounting_document"] for j in journal_entries if j.get("accounting_document")})
    payments = rows_to_dicts(
        conn.execute(
            f"SELECT * FROM payments WHERE accounting_document IN ({','.join('?'*len(accounting_docs))})",
            accounting_docs
        ).fetchall()
    ) if accounting_docs else []

    conn.close()
    return {
        "sales_orders":      sales_orders,
        "deliveries":        deliveries,
        "billing_documents": billing,
        "billing_items":     billing_items,
        "journal_entries":   journal_entries,
        "payments":          payments,
    }


def query_broken_flows() -> dict[str, Any]:
    """
    Identify sales orders with incomplete O2C flows:
    - Delivered but not billed
    - Has sales order items but no delivery
    - Billed but no journal entry posted
    """
    conn = get_connection()

    delivered_not_billed = rows_to_dicts(conn.execute("""
        SELECT DISTINCT
            soh.sales_order,
            soh.sold_to_party,
            soh.total_net_amount,
            soh.transaction_currency,
            soh.creation_date,
            odh.delivery_document,
            'Delivered — not billed' AS issue
        FROM sales_order_headers soh
        JOIN outbound_delivery_items odi ON odi.reference_sd_document = soh.sales_order
        JOIN outbound_delivery_headers odh ON odh.delivery_document = odi.delivery_document
        WHERE NOT EXISTS (
            SELECT 1 FROM billing_document_items bdi
            WHERE bdi.reference_sd_document = odh.delivery_document
        )
        ORDER BY soh.creation_date DESC
    """).fetchall())

    ordered_not_delivered = rows_to_dicts(conn.execute("""
        SELECT
            soh.sales_order,
            soh.sold_to_party,
            soh.total_net_amount,
            soh.transaction_currency,
            soh.creation_date,
            'Ordered — no delivery found' AS issue
        FROM sales_order_headers soh
        WHERE NOT EXISTS (
            SELECT 1 FROM outbound_delivery_items odi
            WHERE odi.reference_sd_document = soh.sales_order
        )
        ORDER BY soh.creation_date DESC
    """).fetchall())

    billed_not_posted = rows_to_dicts(conn.execute("""
        SELECT
            bdh.billing_document,
            bdh.sold_to_party,
            bdh.total_net_amount,
            bdh.transaction_currency,
            bdh.billing_document_date,
            'Billed — no journal entry posted' AS issue
        FROM billing_document_headers bdh
        WHERE bdh.billing_document_is_cancelled = 0
          AND NOT EXISTS (
              SELECT 1 FROM journal_entry_items j
              WHERE j.reference_document = bdh.billing_document
          )
        ORDER BY bdh.billing_document_date DESC
    """).fetchall())

    conn.close()
    return {
        "delivered_not_billed":  delivered_not_billed,
        "ordered_not_delivered": ordered_not_delivered,
        "billed_not_posted":     billed_not_posted,
        "summary": {
            "delivered_not_billed_count":  len(delivered_not_billed),
            "ordered_not_delivered_count": len(ordered_not_delivered),
            "billed_not_posted_count":     len(billed_not_posted),
        }
    }
