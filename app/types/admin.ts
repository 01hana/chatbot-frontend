/**
 * Admin (back-office) ViewModel types (T-005)
 */

// ── Shared ───────────────────────────────────────────────────

/** Pagination metadata returned by list endpoints. */
export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
}

/** Common date-range filter used by list endpoints. */
export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

/** Generic admin list query params (extend per endpoint). */
export interface AdminListParams extends DateRangeFilter {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AdminFilterOption<TValue extends string = string> {
  label: string;
  value: TValue;
}

// ── Conversations ────────────────────────────────────────────

/** Summary row shown in the conversations list table. */
export interface ConversationSummaryVM {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  endTime?: string;
  /** Duration in seconds. */
  durationSeconds?: number;
  messageCount: number;
  status: 'active' | 'closed' | 'handoff';
  leadSubmitted: boolean;
}

/** Full conversation detail including all messages. */
export interface ConversationDetailVM extends ConversationSummaryVM {
  messages: import('./chat').ChatMessageVM[];
  feedbackSummary: FeedbackSummaryDTO;
}

export interface ConversationListParams extends AdminListParams {
  status?: ConversationSummaryVM['status'];
}

// ── Leads ────────────────────────────────────────────────────

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'closed';

/** A lead record stored after form submission. */
export interface LeadVM {
  id: string;
  sessionId: string;
  name: string;
  company: string;
  phone?: string;
  email?: string;
  /** Original field name in admin API (message field from lead form). */
  inquiry?: string;
  note?: string;
  status?: LeadStatus;
  /** Locale tag e.g. 'zh-TW' | 'en'. */
  language?: string;
  createdAt: string;
}

export type LeadSummaryVM = LeadVM;

export interface LeadListParams extends AdminListParams {
  status?: LeadStatus;
}

export interface LeadUpdatePayload {
  status?: LeadStatus;
  note?: string;
}

// ── Tickets ──────────────────────────────────────────────────

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high';

export interface TicketNoteVM {
  id: string;
  content: string;
  createdAt: string;
  createdBy?: string;
}

export interface TicketTimelineEvent {
  id: string;
  eventType: 'created' | 'status_change' | 'note_added';
  fromStatus?: TicketStatus;
  toStatus?: TicketStatus;
  content?: string;
  occurredAt: string;
  createdBy?: string;
}

/** A ticket created when a user requests human handoff. */
export interface TicketVM {
  id: string;
  sessionId: string;
  /** Short subject/title for the ticket. */
  title?: string;
  /** Full problem description. */
  summary?: string;
  priority?: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  resolvedAt?: string;
  notes?: TicketNoteVM[];
  timeline?: TicketTimelineEvent[];
}

export type TicketSummaryVM = TicketVM;

export interface TicketListParams extends AdminListParams {
  status?: TicketStatus;
  priority?: TicketPriority;
}

// ── Knowledge Base ───────────────────────────────────────────

export type KnowledgeStatus = 'draft' | 'published' | 'archived';

/** A single knowledge base entry (Q&A pair). */
export interface KnowledgeEntryVM {
  id: string;
  title: string;
  category: string;
  status: KnowledgeStatus;
  content: string;
  updatedAt: string;
  currentRevision: number;
}

export type KnowledgeEntrySummaryVM = Pick<
  KnowledgeEntryVM,
  'id' | 'title' | 'category' | 'status' | 'updatedAt' | 'currentRevision'
>;

export type KnowledgeSummaryVM = KnowledgeEntrySummaryVM;

export interface KnowledgeRevisionVM {
  revisionId: string;
  entryId: string;
  revisionNumber: number;
  content: string;
  updatedAt: string;
  note?: string;
  diff?: string;
}

export interface KnowledgeListParams extends AdminListParams {
  category?: string;
  status?: KnowledgeStatus;
}

export interface KnowledgeFiltersVM {
  category: AdminFilterOption<string>[];
  status: AdminFilterOption<KnowledgeStatus>[];
}

export interface KnowledgeCreatePayload {
  title: string;
  category: string;
  status?: KnowledgeStatus;
  content: string;
}

export type KnowledgeUpdatePayload = Partial<Omit<KnowledgeCreatePayload, 'status'>>;

export interface KnowledgeImportResult {
  success: number;
  failed: number;
  errors?: {
    row?: number;
    message: string;
  }[];
}

// ── Intents ──────────────────────────────────────────────────

/** An intent definition used for routing/matching. */
export interface IntentVM {
  id: string;
  name: string;
  /** Sample utterances that map to this intent. */
  examples: string[];
  /** Tags/trigger keywords. */
  keywords: string[];
  status: 'active' | 'inactive';
  sortOrder: number;
}

export interface IntentListParams extends AdminListParams {
  status?: IntentVM['status'];
}

export interface IntentCreatePayload {
  name: string;
  examples?: string[];
  keywords?: string[];
  status?: IntentVM['status'];
  sortOrder?: number;
}

export type IntentUpdatePayload = Partial<IntentCreatePayload>;

export interface IntentPreviewResult {
  matched: boolean;
  intent?: IntentVM;
  confidence?: number;
}

// ── Quick Replies ────────────────────────────────────────────

/** Admin-managed quick reply chip shown in the chat widget. */
export interface QuickReplyVM {
  id: string;
  label: Partial<Record<'zh-TW' | 'en', string>>;
  sortOrder: number;
  status: 'active' | 'inactive';
}

export interface QuickReplyCreatePayload {
  label: QuickReplyVM['label'];
  sortOrder?: number;
  status?: QuickReplyVM['status'];
}

export type QuickReplyUpdatePayload = Partial<QuickReplyCreatePayload>;

export type WidgetSettingsVM = import('./chat').WidgetConfigVM;

export type WidgetSettingsUpdatePayload = Partial<WidgetSettingsVM>;

// ── Audit Events ────────────────────────────────────────────

/** An entry in the admin audit log. */
export interface AuditEventVM {
  id: string;
  eventType: string;
  sessionId?: string;
  payload?: Record<string, unknown>;
  createdAt: string;
}

// ── Feedback ────────────────────────────────────────────────

/** A user feedback record stored by the backend. */
export interface FeedbackVM {
  id: string;
  sessionId: string;
  messageId: string;
  type: 'up' | 'down';
  reason?: string;
  createdAt: string;
}

// ── Dashboard ────────────────────────────────────────────────

/** KPI stats for the dashboard stat cards. */
export interface DashboardStatsVM {
  /** Today's total conversations. */
  todayConversations: number;
  /** This month's total conversations (legacy field). */
  monthConversations: number;
  /** This month's total conversations (preferred alias). */
  monthlyConversations?: number;
  /** Percentage (0–100) — legacy field. */
  selfServiceRate: number;
  /** AI resolution rate percentage (0–100). */
  aiResolutionRate?: number;
  pendingTickets: number;
  /** Legacy field. */
  newLeadsThisMonth: number;
  /** This month's new leads (preferred alias). */
  monthlyLeads?: number;
  /** Daily conversation count trend (last N days). */
  conversationTrend?: { date: string; value: number }[];
  /** Intent hit distribution. */
  intentDistribution?: { label: string; value: number }[];
  /** Handoff reason distribution. */
  handoffReasonDistribution?: { label: string; value: number }[];
  /** Latest audit events for the activity feed. */
  latestAuditEvents?: AuditEventVM[];
}

// ── Reports ──────────────────────────────────────────────────

/** A single data point in a time-series report chart. */
export interface ReportDataPoint {
  /** Date label (e.g. "2026-04-01"). */
  date: string;
  value: number;
}

/** Aggregated report data for the reports page. */
export interface ReportDataVM {
  conversationTrend: ReportDataPoint[];
  intentDistribution: { label: string; value: number }[];
  feedbackSummary: { up: number; down: number };
  selfServiceRateTrend: ReportDataPoint[];
  avgResponseTimeTrend: ReportDataPoint[];
}

// ── Conversations ────────────────────────────────────────────

/** Summary row shown in the conversations list table. */
export interface ConversationSummaryVM {
  id: number;
  sessionId: string;
  createdAt: string;
  endTime?: string;
  /** Duration in seconds. */
  durationSeconds?: number;
  messageCount: number;
  status: 'active' | 'closed' | 'handoff';
  leadSubmitted: boolean;
}

/** Full conversation detail including all messages. */
export interface ConversationDetailVM extends ConversationSummaryVM {
  messages: import('./chat').ChatMessageVM[];
}
