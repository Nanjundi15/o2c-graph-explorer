"""
ingest.py
---------
One-time script to load all SAP O2C JSONL files into a structured SQLite database.
Run once before starting the API: python ingest.py

Design decisions:
- Flat table per entity (no EAV) — makes SQL queries readable and performant
- camelCase JSON keys → snake_case columns for Python convention
- Composite PKs where appropriate (avoids silent duplicates)
- Only columns defined in schema are inserted; extra JSONL fields are dropped cleanly
- product_storage_locations excluded — 16k warehouse bin records not relevant to O2C flow
"""

import json
import re
import sqlite3
from pathlib import Path

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

import os
# Local dev: data sits two dirs up. Railway: set DATA_DIR / DB_PATH env vars.
DATA_DIR = Path(os.getenv("DATA_DIR",  Path(__file__).parent.parent / "data" / "sap-o2c-data"))
DB_PATH  = Path(os.getenv("DB_PATH",   Path(__file__).parent.parent / "data" / "o2c.db"))


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def camel_to_snake(name: str) -> str:
    s = re.sub(r"([A-Z]+)([A-Z][a-z])", r"\1_\2", name)
    s = re.sub(r"([a-z\d])([A-Z])", r"\1_\2", s)
    return s.lower()


def read_jsonl_dir(folder: str) -> list:
    records = []
    entity_path = DATA_DIR / folder
    for file in sorted(entity_path.glob("*.jsonl")):
        with open(file, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    records.append(json.loads(line))
    return records


def flatten(record: dict) -> dict:
    """Flatten nested dicts and convert all keys to snake_case."""
    flat = {}
    for key, val in record.items():
        snake = camel_to_snake(key)
        if isinstance(val, dict):
            for sub_key, sub_val in val.items():
                flat[f"{snake}_{camel_to_snake(sub_key)}"] = sub_val
        else:
            flat[snake] = val
    return flat


def get_table_columns(conn: sqlite3.Connection, table: str) -> set:
    cursor = conn.execute(f"PRAGMA table_info({table})")
    return {row[1] for row in cursor.fetchall()}


def insert_records(conn: sqlite3.Connection, table: str, records: list) -> int:
    """
    Insert records, dropping any JSONL fields not present in the schema.
    Uses INSERT OR IGNORE so re-runs are safe.
    """
    if not records:
        return 0

    flat_records = [flatten(r) for r in records]
    table_cols = get_table_columns(conn, table)

    # Only insert columns that exist in schema
    all_keys = list(flat_records[0].keys())
    columns = [c for c in all_keys if c in table_cols]
    if not columns:
        return 0

    placeholders = ", ".join(["?"] * len(columns))
    col_list = ", ".join(columns)
    sql = f"INSERT OR IGNORE INTO {table} ({col_list}) VALUES ({placeholders})"

    rows = [[r.get(c) for c in columns] for r in flat_records]
    conn.executemany(sql, rows)
    conn.commit()
    return len(rows)


# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------

SCHEMA = """
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS business_partners (
    business_partner            TEXT PRIMARY KEY,
    customer                    TEXT,
    business_partner_full_name  TEXT,
    business_partner_name       TEXT,
    business_partner_category   TEXT,
    business_partner_grouping   TEXT,
    created_by_user             TEXT,
    creation_date               TEXT,
    last_change_date            TEXT,
    business_partner_is_blocked INTEGER,
    is_marked_for_archiving     INTEGER
);

CREATE TABLE IF NOT EXISTS business_partner_addresses (
    business_partner    TEXT,
    address_id          TEXT,
    city_name           TEXT,
    country             TEXT,
    postal_code         TEXT,
    region              TEXT,
    street_name         TEXT,
    address_time_zone   TEXT,
    validity_start_date TEXT,
    validity_end_date   TEXT,
    PRIMARY KEY (business_partner, address_id)
);

CREATE TABLE IF NOT EXISTS customer_company_assignments (
    customer                TEXT,
    company_code            TEXT,
    reconciliation_account  TEXT,
    payment_terms           TEXT,
    customer_account_group  TEXT,
    deletion_indicator      INTEGER,
    PRIMARY KEY (customer, company_code)
);

CREATE TABLE IF NOT EXISTS customer_sales_area_assignments (
    customer                    TEXT,
    sales_organization          TEXT,
    distribution_channel        TEXT,
    division                    TEXT,
    currency                    TEXT,
    customer_payment_terms      TEXT,
    delivery_priority           TEXT,
    incoterms_classification    TEXT,
    incoterms_location1         TEXT,
    shipping_condition          TEXT,
    PRIMARY KEY (customer, sales_organization, distribution_channel, division)
);

CREATE TABLE IF NOT EXISTS products (
    product                 TEXT PRIMARY KEY,
    product_type            TEXT,
    product_group           TEXT,
    base_unit               TEXT,
    division                TEXT,
    industry_sector         TEXT,
    gross_weight            REAL,
    net_weight              REAL,
    weight_unit             TEXT,
    created_by_user         TEXT,
    creation_date           TEXT,
    last_change_date        TEXT,
    is_marked_for_deletion  INTEGER
);

CREATE TABLE IF NOT EXISTS product_descriptions (
    product             TEXT,
    language            TEXT,
    product_description TEXT,
    PRIMARY KEY (product, language)
);

CREATE TABLE IF NOT EXISTS plants (
    plant                       TEXT PRIMARY KEY,
    plant_name                  TEXT,
    sales_organization          TEXT,
    distribution_channel        TEXT,
    division                    TEXT,
    factory_calendar            TEXT,
    valuation_area              TEXT,
    is_marked_for_archiving     INTEGER
);

CREATE TABLE IF NOT EXISTS product_plants (
    product         TEXT,
    plant           TEXT,
    profit_center   TEXT,
    mrp_type        TEXT,
    PRIMARY KEY (product, plant)
);

CREATE TABLE IF NOT EXISTS sales_order_headers (
    sales_order                     TEXT PRIMARY KEY,
    sales_order_type                TEXT,
    sales_organization              TEXT,
    distribution_channel            TEXT,
    organization_division           TEXT,
    sold_to_party                   TEXT,
    created_by_user                 TEXT,
    creation_date                   TEXT,
    last_change_date_time           TEXT,
    total_net_amount                REAL,
    transaction_currency            TEXT,
    overall_delivery_status         TEXT,
    overall_ord_reltd_bilg_status   TEXT,
    overall_sd_doc_reference_status TEXT,
    pricing_date                    TEXT,
    requested_delivery_date         TEXT,
    header_billing_block_reason     TEXT,
    delivery_block_reason           TEXT,
    incoterms_classification        TEXT,
    incoterms_location1             TEXT,
    customer_payment_terms          TEXT,
    FOREIGN KEY (sold_to_party) REFERENCES business_partners(business_partner)
);

CREATE TABLE IF NOT EXISTS sales_order_items (
    sales_order                 TEXT,
    sales_order_item            TEXT,
    sales_order_item_category   TEXT,
    material                    TEXT,
    requested_quantity          REAL,
    requested_quantity_unit     TEXT,
    net_amount                  REAL,
    transaction_currency        TEXT,
    material_group              TEXT,
    production_plant            TEXT,
    storage_location            TEXT,
    item_billing_block_reason   TEXT,
    sales_document_rjcn_reason  TEXT,
    PRIMARY KEY (sales_order, sales_order_item),
    FOREIGN KEY (sales_order) REFERENCES sales_order_headers(sales_order),
    FOREIGN KEY (material)    REFERENCES products(product)
);

CREATE TABLE IF NOT EXISTS sales_order_schedule_lines (
    sales_order                             TEXT,
    sales_order_item                        TEXT,
    schedule_line                           TEXT,
    confirmed_delivery_date                 TEXT,
    order_quantity_unit                     TEXT,
    confd_order_qty_by_matl_avail_check     REAL,
    PRIMARY KEY (sales_order, sales_order_item, schedule_line)
);

CREATE TABLE IF NOT EXISTS outbound_delivery_headers (
    delivery_document               TEXT PRIMARY KEY,
    shipping_point                  TEXT,
    creation_date                   TEXT,
    actual_goods_movement_date      TEXT,
    overall_goods_movement_status   TEXT,
    overall_picking_status          TEXT,
    header_billing_block_reason     TEXT,
    delivery_block_reason           TEXT
);

CREATE TABLE IF NOT EXISTS outbound_delivery_items (
    delivery_document           TEXT,
    delivery_document_item      TEXT,
    reference_sd_document       TEXT,
    reference_sd_document_item  TEXT,
    plant                       TEXT,
    storage_location            TEXT,
    actual_delivery_quantity    REAL,
    delivery_quantity_unit      TEXT,
    item_billing_block_reason   TEXT,
    PRIMARY KEY (delivery_document, delivery_document_item),
    FOREIGN KEY (delivery_document)     REFERENCES outbound_delivery_headers(delivery_document),
    FOREIGN KEY (reference_sd_document) REFERENCES sales_order_headers(sales_order)
);

CREATE TABLE IF NOT EXISTS billing_document_headers (
    billing_document                TEXT PRIMARY KEY,
    billing_document_type           TEXT,
    billing_document_date           TEXT,
    creation_date                   TEXT,
    total_net_amount                REAL,
    transaction_currency            TEXT,
    company_code                    TEXT,
    fiscal_year                     TEXT,
    accounting_document             TEXT,
    sold_to_party                   TEXT,
    billing_document_is_cancelled   INTEGER,
    cancelled_billing_document      TEXT,
    FOREIGN KEY (sold_to_party) REFERENCES business_partners(business_partner)
);

CREATE TABLE IF NOT EXISTS billing_document_items (
    billing_document            TEXT,
    billing_document_item       TEXT,
    material                    TEXT,
    billing_quantity            REAL,
    billing_quantity_unit       TEXT,
    net_amount                  REAL,
    transaction_currency        TEXT,
    reference_sd_document       TEXT,
    reference_sd_document_item  TEXT,
    PRIMARY KEY (billing_document, billing_document_item),
    FOREIGN KEY (billing_document)      REFERENCES billing_document_headers(billing_document),
    FOREIGN KEY (reference_sd_document) REFERENCES outbound_delivery_headers(delivery_document),
    FOREIGN KEY (material)              REFERENCES products(product)
);

CREATE TABLE IF NOT EXISTS billing_document_cancellations (
    billing_document                TEXT PRIMARY KEY,
    billing_document_type           TEXT,
    billing_document_date           TEXT,
    creation_date                   TEXT,
    total_net_amount                REAL,
    transaction_currency            TEXT,
    company_code                    TEXT,
    fiscal_year                     TEXT,
    accounting_document             TEXT,
    sold_to_party                   TEXT,
    billing_document_is_cancelled   INTEGER,
    cancelled_billing_document      TEXT
);

CREATE TABLE IF NOT EXISTS journal_entry_items (
    company_code                    TEXT,
    fiscal_year                     TEXT,
    accounting_document             TEXT,
    accounting_document_item        TEXT,
    gl_account                      TEXT,
    reference_document              TEXT,
    customer                        TEXT,
    financial_account_type          TEXT,
    accounting_document_type        TEXT,
    amount_in_transaction_currency  REAL,
    transaction_currency            TEXT,
    posting_date                    TEXT,
    document_date                   TEXT,
    clearing_date                   TEXT,
    clearing_accounting_document    TEXT,
    clearing_doc_fiscal_year        TEXT,
    profit_center                   TEXT,
    cost_center                     TEXT,
    PRIMARY KEY (company_code, fiscal_year, accounting_document, accounting_document_item),
    FOREIGN KEY (reference_document) REFERENCES billing_document_headers(billing_document)
);

CREATE TABLE IF NOT EXISTS payments (
    company_code                    TEXT,
    fiscal_year                     TEXT,
    accounting_document             TEXT,
    accounting_document_item        TEXT,
    customer                        TEXT,
    clearing_date                   TEXT,
    clearing_accounting_document    TEXT,
    clearing_doc_fiscal_year        TEXT,
    amount_in_transaction_currency  REAL,
    transaction_currency            TEXT,
    posting_date                    TEXT,
    document_date                   TEXT,
    gl_account                      TEXT,
    financial_account_type          TEXT,
    profit_center                   TEXT,
    PRIMARY KEY (company_code, fiscal_year, accounting_document, accounting_document_item)
    -- FK to journal_entry_items omitted: composite PK mismatch in SQLite
);
"""


# ---------------------------------------------------------------------------
# Entity load plan — dimension tables first, then transactional (FK order)
# ---------------------------------------------------------------------------

LOAD_PLAN = [
    ("business_partners",               "business_partners"),
    ("business_partner_addresses",      "business_partner_addresses"),
    ("customer_company_assignments",    "customer_company_assignments"),
    ("customer_sales_area_assignments", "customer_sales_area_assignments"),
    ("products",                        "products"),
    ("product_descriptions",            "product_descriptions"),
    ("plants",                          "plants"),
    ("product_plants",                  "product_plants"),
    ("sales_order_headers",             "sales_order_headers"),
    ("sales_order_items",               "sales_order_items"),
    ("sales_order_schedule_lines",      "sales_order_schedule_lines"),
    ("outbound_delivery_headers",       "outbound_delivery_headers"),
    ("outbound_delivery_items",         "outbound_delivery_items"),
    ("billing_document_headers",        "billing_document_headers"),
    ("billing_document_items",          "billing_document_items"),
    ("billing_document_cancellations",  "billing_document_cancellations"),
    ("journal_entry_items_accounts_receivable", "journal_entry_items"),
    ("payments_accounts_receivable",    "payments"),
    # product_storage_locations intentionally excluded —
    # 16k warehouse bin records are not relevant to O2C flow queries
]


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    print(f"Database → {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)

    conn.executescript(SCHEMA)
    print("Schema applied.\n")

    total = 0
    for folder, table in LOAD_PLAN:
        records = read_jsonl_dir(folder)
        count = insert_records(conn, table, records)
        print(f"  ✓  {table:<45} {count:>5} rows")
        total += count

    conn.close()
    print(f"\nDone — {total} total rows → {DB_PATH}")


if __name__ == "__main__":
    main()
