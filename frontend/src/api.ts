/**
 * api.ts
 * ------
 * Typed API client. All fetch calls live here — components never call fetch directly.
 *
 * In dev:  Vite proxies /api → http://localhost:8000
 * In prod: Set VITE_API_URL to your Railway backend URL, e.g.
 *          VITE_API_URL=https://o2c-api.up.railway.app
 */

import type {
  GraphOverview,
  EntityResponse,
  RecordDetail,
  ChatResponse,
  EntityRecord,
} from './types'

const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:8000/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

// ── Graph ─────────────────────────────────────────────────────────────────────

export const fetchGraphOverview = (): Promise<GraphOverview> =>
  request('/graph/overview')

export const fetchEntityRecords = (entity: string, limit = 50): Promise<EntityResponse> =>
  request(`/graph/entity/${entity}?limit=${limit}`)

export const fetchRecordDetail = (entity: string, id: string): Promise<RecordDetail> =>
  request(`/graph/entity/${entity}/${id}`)

// ── Analytics ─────────────────────────────────────────────────────────────────

export const fetchTopProducts = (): Promise<{ results: EntityRecord[] }> =>
  request('/graph/analytics/top-products')

export const fetchBillingFlow = (billingDocId: string): Promise<Record<string, EntityRecord[]>> =>
  request(`/graph/analytics/billing-flow/${billingDocId}`)

export const fetchBrokenFlows = (): Promise<{
  delivered_not_billed: EntityRecord[]
  ordered_not_delivered: EntityRecord[]
  billed_not_posted: EntityRecord[]
  summary: Record<string, number>
}> => request('/graph/analytics/broken-flows')

// ── Chat ──────────────────────────────────────────────────────────────────────

export const sendChatMessage = (question: string): Promise<ChatResponse> =>
  request('/chat/query', {
    method: 'POST',
    body: JSON.stringify({ question }),
  })
