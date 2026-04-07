/**
 * Admin (back-office) ViewModel types (T-005)
 */

// ── Shared ───────────────────────────────────────────────────

/** Pagination metadata returned by list endpoints. */
export interface PaginationMeta {
  total: number
  page: number
  pageSize: number
}

// ── Conversations ────────────────────────────────────────────

/** Summary row shown in the conversations list table. */
export interface ConversationSummaryVM {
  sessionId: string
  startTime: string
  endTime?: string
  /** Duration in seconds. */
  durationSeconds?: number
  messageCount: number
  status: 'active' | 'closed' | 'handoff'
  leadSubmitted: boolean
}

/** Full conversation detail including all messages. */
export interface ConversationDetailVM extends ConversationSummaryVM {
  messages: import('./chat').ChatMessageVM[]
}

// ── Leads ────────────────────────────────────────────────────

/** A lead record stored after form submission. */
export interface LeadVM {
  id: string
  sessionId: string
  name: string
  company: string
  phone?: string
  email?: string
  inquiry?: string
  note?: string
  submittedAt: string
}

// ── Tickets ──────────────────────────────────────────────────

/** A ticket created when a user requests human handoff. */
export interface TicketVM {
  id: string
  sessionId: string
  status: 'pending' | 'in-progress' | 'resolved'
  createdAt: string
  resolvedAt?: string
}

// ── Knowledge Base ───────────────────────────────────────────

/** A single knowledge base entry (Q&A pair). */
export interface KnowledgeEntryVM {
  id: string
  question: string
  answer: string
  category?: string
  status: 'active' | 'inactive'
  version: number
  updatedAt: string
}

// ── Intents ──────────────────────────────────────────────────

/** An intent definition used for routing/matching. */
export interface IntentVM {
  id: string
  name: string
  /** Sample utterances that map to this intent. */
  examples: string[]
  /** Tags/trigger keywords. */
  keywords: string[]
  status: 'active' | 'inactive'
  sortOrder: number
}

// ── Quick Replies ────────────────────────────────────────────

/** Admin-managed quick reply chip shown in the chat widget. */
export interface QuickReplyVM {
  id: string
  label: Partial<Record<'zh-TW' | 'en', string>>
  sortOrder: number
  status: 'active' | 'inactive'
}

// ── Audit Events ────────────────────────────────────────────

/** An entry in the admin audit log. */
export interface AuditEventVM {
  id: string
  eventType: string
  sessionId?: string
  payload?: Record<string, unknown>
  occurredAt: string
}

// ── Feedback ────────────────────────────────────────────────

/** A user feedback record stored by the backend. */
export interface FeedbackVM {
  id: string
  sessionId: string
  messageId: string
  type: 'up' | 'down'
  reason?: string
  submittedAt: string
}

// ── Dashboard ────────────────────────────────────────────────

/** KPI stats for the dashboard stat cards. */
export interface DashboardStatsVM {
  todayConversations: number
  monthConversations: number
  /** Percentage (0–100). */
  selfServiceRate: number
  pendingTickets: number
  newLeadsThisMonth: number
}

// ── Reports ──────────────────────────────────────────────────

/** A single data point in a time-series report chart. */
export interface ReportDataPoint {
  /** Date label (e.g. "2026-04-01"). */
  date: string
  value: number
}

/** Aggregated report data for the reports page. */
export interface ReportDataVM {
  conversationTrend: ReportDataPoint[]
  intentDistribution: { label: string; value: number }[]
  feedbackSummary: { up: number; down: number }
  selfServiceRateTrend: ReportDataPoint[]
  avgResponseTimeTrend: ReportDataPoint[]
}
