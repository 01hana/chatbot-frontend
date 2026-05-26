/**
 * tests/fixtures/adminFixtures.ts (T-014 / T-051)
 *
 * Typed mock data for admin API responses used in unit and E2E tests.
 */

import type {
  ConversationSummaryVM,
  ConversationDetailVM,
  LeadVM,
  TicketVM,
  TicketNoteVM,
  TicketTimelineEvent,
  KnowledgeEntryVM,
  DashboardStatsVM,
  AuditEventVM,
} from '../../app/types/admin'
import type { PaginatedResponse } from '../../app/types/api'

// ── Dashboard ─────────────────────────────────────────────────────────────

const mockAuditEvents: AuditEventVM[] = [
  {
    id: 'audit-001',
    eventType: 'ticket.created',
    sessionId: 'sess-001',
    payload: { ticketId: 'ticket-001' },
    occurredAt: '2026-04-07T08:01:00Z',
  },
  {
    id: 'audit-002',
    eventType: 'lead.submitted',
    sessionId: 'sess-001',
    payload: { leadId: 'lead-001' },
    occurredAt: '2026-04-07T08:02:00Z',
  },
]

export const mockDashboardStats: DashboardStatsVM = {
  todayConversations: 42,
  monthConversations: 1280,
  monthlyConversations: 1280,
  selfServiceRate: 87,
  aiResolutionRate: 87,
  pendingTickets: 18,
  newLeadsThisMonth: 94,
  monthlyLeads: 94,
  conversationTrend: [
    { date: '2026-04-01', value: 38 },
    { date: '2026-04-02', value: 45 },
    { date: '2026-04-03', value: 52 },
    { date: '2026-04-04', value: 41 },
    { date: '2026-04-05', value: 60 },
    { date: '2026-04-06', value: 55 },
    { date: '2026-04-07', value: 42 },
  ],
  intentDistribution: [
    { label: 'product-inquiry', value: 420 },
    { label: 'general-faq', value: 310 },
    { label: 'product-diagnosis', value: 280 },
    { label: 'handoff', value: 150 },
    { label: 'fallback', value: 120 },
  ],
  handoffReasonDistribution: [
    { label: '複雜問題', value: 65 },
    { label: '客戶要求', value: 45 },
    { label: '報價確認', value: 40 },
  ],
  latestAuditEvents: mockAuditEvents,
}

// ── Conversations ─────────────────────────────────────────────────────────

export const mockConversationSummaries: ConversationSummaryVM[] = [
  {
    sessionId: 'sess-001',
    createdAt: '2026-04-07T08:00:00Z',
    endTime: '2026-04-07T08:03:22Z',
    durationSeconds: 202,
    messageCount: 6,
    status: 'closed',
    leadSubmitted: true,
  },
  {
    sessionId: 'sess-002',
    createdAt: '2026-04-07T09:15:00Z',
    messageCount: 2,
    status: 'active',
    leadSubmitted: false,
  },
  {
    sessionId: 'sess-003',
    createdAt: '2026-04-07T10:00:00Z',
    endTime: '2026-04-07T10:12:00Z',
    durationSeconds: 720,
    messageCount: 12,
    status: 'handoff',
    leadSubmitted: true,
  },
]

export const mockConversationDetail: ConversationDetailVM = {
  ...mockConversationSummaries[0]!,
  messages: [
    {
      id: 'msg-1',
      type: 'user',
      content: '你們的產品有哪些？',
      timestamp: '2026-04-07T08:00:05Z',
    },
    {
      id: 'msg-2',
      type: 'ai',
      content: '我們提供多種工業用液體過濾器，包括高壓型與標準型。',
      timestamp: '2026-04-07T08:00:08Z',
      metadata: { confidence: 0.91 },
    },
    {
      id: 'msg-3',
      type: 'user',
      content: '高壓型的規格是什麼？',
      timestamp: '2026-04-07T08:01:00Z',
    },
    {
      id: 'msg-4',
      type: 'ai',
      content: '高壓型過濾器耐壓達 150 bar，適用於液壓系統，過濾精度為 3–25 μm。',
      timestamp: '2026-04-07T08:01:04Z',
      metadata: { confidence: 0.88 },
      rating: 'up',
    },
    {
      id: 'msg-5',
      type: 'user',
      content: '我想要報價',
      timestamp: '2026-04-07T08:02:00Z',
    },
    {
      id: 'msg-6',
      type: 'system-error',
      content: '',
      timestamp: '2026-04-07T08:02:30Z',
    },
  ],
}

export const mockConversationListResponse: PaginatedResponse<ConversationSummaryVM> = {
  data: mockConversationSummaries,
  success: true,
  meta: { total: 3, page: 1, pageSize: 20, totalPages: 1 },
}

// ── Leads ─────────────────────────────────────────────────────────────────

export const mockLeads: LeadVM[] = [
  {
    id: 'lead-001',
    sessionId: 'sess-001',
    name: '王小明',
    company: '台灣機械有限公司',
    phone: '0912-345-678',
    email: 'wang@example.com',
    inquiry: '高壓過濾器',
    status: 'contacted',
    submittedAt: '2026-04-07T08:02:00Z',
  },
  {
    id: 'lead-002',
    sessionId: 'sess-003',
    name: '林美華',
    company: '南部工業股份有限公司',
    phone: '0923-456-789',
    email: 'lin@example.com',
    inquiry: '客製化訂製螺絲',
    status: 'new',
    submittedAt: '2026-04-07T10:10:00Z',
  },
]

export const mockLeadDetail: LeadVM = {
  ...mockLeads[0]!,
  note: '已電話聯繫，對方需要 100 支高壓型過濾器報價',
}

export const mockLeadListResponse: PaginatedResponse<LeadVM> = {
  data: mockLeads,
  success: true,
  meta: { total: 2, page: 1, pageSize: 20, totalPages: 1 },
}

// ── Tickets ───────────────────────────────────────────────────────────────

const mockTicketNotes: TicketNoteVM[] = [
  {
    id: 'note-001',
    content: '已電話聯繫客戶，確認需求細節',
    createdAt: '2026-04-07T08:30:00Z',
    createdBy: 'admin@example.com',
  },
  {
    id: 'note-002',
    content: '已提供報價單，等待客戶回覆',
    createdAt: '2026-04-07T08:42:00Z',
    createdBy: 'admin@example.com',
  },
]

const mockTicketTimeline: TicketTimelineEvent[] = [
  {
    id: 'tl-001',
    eventType: 'created',
    toStatus: 'open',
    occurredAt: '2026-04-07T08:01:00Z',
    createdBy: 'system',
  },
  {
    id: 'tl-002',
    eventType: 'status_change',
    fromStatus: 'open',
    toStatus: 'in_progress',
    occurredAt: '2026-04-07T08:25:00Z',
    createdBy: 'admin@example.com',
  },
  {
    id: 'tl-003',
    eventType: 'note_added',
    content: '已電話聯繫客戶，確認需求細節',
    occurredAt: '2026-04-07T08:30:00Z',
    createdBy: 'admin@example.com',
  },
  {
    id: 'tl-004',
    eventType: 'status_change',
    fromStatus: 'in_progress',
    toStatus: 'resolved',
    occurredAt: '2026-04-07T08:45:00Z',
    createdBy: 'admin@example.com',
  },
]

export const mockTickets: TicketVM[] = [
  {
    id: 'ticket-001',
    sessionId: 'sess-001',
    status: 'resolved',
    createdAt: '2026-04-07T08:01:00Z',
    resolvedAt: '2026-04-07T08:45:00Z',
  },
  {
    id: 'ticket-002',
    sessionId: 'sess-003',
    status: 'open',
    createdAt: '2026-04-07T10:05:00Z',
  },
  {
    id: 'ticket-003',
    sessionId: 'sess-004',
    status: 'in_progress',
    createdAt: '2026-04-06T14:00:00Z',
  },
]

export const mockTicketDetail: TicketVM = {
  ...mockTickets[0]!,
  notes: mockTicketNotes,
  timeline: mockTicketTimeline,
}

export const mockTicketListResponse: PaginatedResponse<TicketVM> = {
  data: mockTickets,
  success: true,
  meta: { total: 3, page: 1, pageSize: 20, totalPages: 1 },
}

// ── Knowledge Base ────────────────────────────────────────────────────────

export const mockKnowledgeEntries: KnowledgeEntryVM[] = [
  {
    id: 'kb-001',
    question: '你們的過濾器適用於哪些液體？',
    answer: '適用於水、油、化學溶劑等多種工業液體。',
    category: '產品規格',
    status: 'active',
    version: 3,
    updatedAt: '2026-03-15T10:00:00Z',
  },
]


// ── Dashboard ─────────────────────────────────────────────────────────────

export const mockDashboardStats: DashboardStatsVM = {
  todayConversations: 42,
  monthConversations: 1280,
  selfServiceRate: 87,
  pendingTickets: 18,
  newLeadsThisMonth: 94,
}

// ── Conversations ─────────────────────────────────────────────────────────

export const mockConversationSummaries: ConversationSummaryVM[] = [
  {
    sessionId: 'sess-001',
    createdAt: '2026-04-07T08:00:00Z',
    endTime: '2026-04-07T08:03:22Z',
    durationSeconds: 202,
    messageCount: 6,
    status: 'closed',
    leadSubmitted: true,
  },
  {
    sessionId: 'sess-002',
    createdAt: '2026-04-07T09:15:00Z',
    messageCount: 2,
    status: 'active',
    leadSubmitted: false,
  },
]

export const mockConversationDetail: ConversationDetailVM = {
  ...mockConversationSummaries[0]!,
  messages: [
    {
      id: 'msg-1',
      type: 'user',
      content: '你們的產品有哪些？',
      timestamp: '2026-04-07T08:00:05Z',
    },
    {
      id: 'msg-2',
      type: 'ai',
      content: '我們提供多種工業用液體過濾器，包括高壓型與標準型。',
      timestamp: '2026-04-07T08:00:08Z',
      metadata: { confidence: 0.91 },
    },
  ],
}

export const mockConversationListResponse: PaginatedResponse<ConversationSummaryVM> = {
  data: mockConversationSummaries,
  success: true,
  meta: { total: 2, page: 1, pageSize: 20, totalPages: 1 },
}

// ── Leads ─────────────────────────────────────────────────────────────────

export const mockLeads: LeadVM[] = [
  {
    id: 'lead-001',
    sessionId: 'sess-001',
    name: '王小明',
    company: '台灣機械有限公司',
    phone: '0912-345-678',
    email: 'wang@example.com',
    inquiry: '高壓過濾器',
    submittedAt: '2026-04-07T08:02:00Z',
  },
]

export const mockLeadListResponse: PaginatedResponse<LeadVM> = {
  data: mockLeads,
  success: true,
  meta: { total: 1, page: 1, pageSize: 20, totalPages: 1 },
}

// ── Tickets ───────────────────────────────────────────────────────────────

export const mockTickets: TicketVM[] = [
  {
    id: 'ticket-001',
    sessionId: 'sess-001',
    status: 'resolved',
    createdAt: '2026-04-07T08:01:00Z',
    resolvedAt: '2026-04-07T08:45:00Z',
  },
]

// ── Knowledge Base ────────────────────────────────────────────────────────

export const mockKnowledgeEntries: KnowledgeEntryVM[] = [
  {
    id: 'kb-001',
    question: '你們的過濾器適用於哪些液體？',
    answer: '適用於水、油、化學溶劑等多種工業液體。',
    category: '產品規格',
    status: 'active',
    version: 3,
    updatedAt: '2026-03-15T10:00:00Z',
  },
]
