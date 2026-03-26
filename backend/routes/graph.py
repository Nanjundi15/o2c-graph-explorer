"""
routes/graph.py
---------------
Graph visualization endpoints.
All heavy lifting is in database.py — routes are thin controllers.
"""

from fastapi import APIRouter, HTTPException
from database import (
    get_graph_overview,
    get_entity_records,
    get_record_detail,
    query_top_products_by_billing,
    query_billing_document_flow,
    query_broken_flows,
)

router = APIRouter()


@router.get("/overview")
def graph_overview():
    """Return the top-level graph: entity type nodes + O2C relationship edges."""
    return get_graph_overview()


@router.get("/entity/{entity}")
def entity_records(entity: str, limit: int = 50):
    """Return up to `limit` records for the given entity type."""
    try:
        return {"entity": entity, "records": get_entity_records(entity, limit)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/entity/{entity}/{record_id}")
def record_detail(entity: str, record_id: str):
    """Return a single record with its related records across the O2C chain."""
    result = get_record_detail(entity, record_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Record not found")
    return result


@router.get("/analytics/top-products")
def top_products():
    """Products with the most associated billing documents."""
    return {"results": query_top_products_by_billing()}


@router.get("/analytics/billing-flow/{billing_doc_id}")
def billing_flow(billing_doc_id: str):
    """Trace the full O2C chain for a billing document."""
    return query_billing_document_flow(billing_doc_id)


@router.get("/analytics/broken-flows")
def broken_flows():
    """Sales orders and billing documents with incomplete O2C flows."""
    return query_broken_flows()
