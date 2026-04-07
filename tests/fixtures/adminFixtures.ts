/**
 * tests/fixtures/adminFixtures.ts (T-014)
 *
 * Typed mock data for admin API responses used in unit and E2E tests.
 */

import type {
  ConversationSummaryVM,
  ConversationDetailVM,
  LeadVM,
  TicketVM,
  KnowledgeEntryVM,
  DashboardStatsVM,
  PaginationMeta,
} from '../../app/types/admin'
import type { PaginatedResponse } from '../../app/types/api'

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
    startTime: '2026-04-07T08:00:00Z',
    endTime: '2026-04-07T08:03:22Z',
    durationSeconds: 202,
    messageCount: 6,
    status: 'closed',
    leadSubmitted: true,
  },
  {
    sessionId: 'sess-002',
    startTime: '2026-04-07T09:15:00Z',
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
