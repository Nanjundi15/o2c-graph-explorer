// ── Graph types ──────────────────────────────────────────────────────────────

export interface GraphNode {
  id: string
  label: string
  count: number
  type: string
}

export interface GraphEdge {
  source: string
  target: string
  label: string
}

export interface GraphOverview {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

// ── Entity / Record types ────────────────────────────────────────────────────

export type EntityRecord = Record<string, string | number | boolean | null>

export interface EntityResponse {
  entity: string
  records: EntityRecord[]
}

export interface RecordDetail {
  record: EntityRecord
  related: Record<string, EntityRecord[]>
}

// ── Chat types ───────────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant' | 'error'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  sql?: string
  data?: EntityRecord[]
  rowCount?: number
  isOffTopic?: boolean
  timestamp: Date
}

export interface ChatResponse {
  answer: string
  sql: string | null
  data: EntityRecord[]
  row_count?: number
  is_off_topic: boolean
}

// ── UI State ─────────────────────────────────────────────────────────────────

export type PanelView = 'graph' | 'analytics'

export interface SelectedNode {
  id: string
  entity: string
  recordId?: string
}
