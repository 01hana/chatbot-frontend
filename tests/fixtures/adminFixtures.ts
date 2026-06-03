/**
 * tests/fixtures/adminFixtures.ts (T-014 / T-051 / T-058)
 *
 * Typed mock data for admin API responses used in unit and E2E tests.
 */

import type {
  AuditEventVM,
  ConversationDetailVM,
  ConversationSummaryVM,
  DashboardStatsVM,
  IntentVM,
  KnowledgeEntryVM,
  KnowledgeRevisionVM,
  LeadVM,
  QuickReplyVM,
  TicketNoteVM,
  TicketTimelineEvent,
  TicketVM,
  WidgetSettingsVM,
} from '../../app/types/admin';
import type { PaginatedResponse } from '../../app/types/api';

// ── Audit Events ─────────────────────────────────────────────────────────

export const mockAuditEvents: AuditEventVM[] = [
  {
    id: 'audit-001',
    eventType: 'ticket.created',
    sessionId: 'sess-001',
    payload: { ticketId: 'ticket-001' },
    createdAt: '2026-04-07T08:01:00Z',
  },
  {
    id: 'audit-002',
    eventType: 'lead.submitted',
    sessionId: 'sess-001',
    payload: { leadId: 'lead-001' },
    createdAt: '2026-04-07T08:02:00Z',
  },
];

// ── Dashboard ─────────────────────────────────────────────────────────────

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
  ],
  intentDistribution: [
    { label: 'product-inquiry', value: 420 },
    { label: 'general-faq', value: 310 },
  ],
  handoffReasonDistribution: [
    { label: '複雜問題', value: 65 },
    { label: '客戶要求', value: 45 },
  ],
  latestAuditEvents: mockAuditEvents,
};

// ── Conversations ─────────────────────────────────────────────────────────

export const mockConversationSummaries: ConversationSummaryVM[] = [
  {
    id: 1,
    sessionId: 'sess-001',
    createdAt: '2026-04-07T08:00:00Z',
    updatedAt: '2026-04-07T08:03:22Z',
    endTime: '2026-04-07T08:03:22Z',
    durationSeconds: 202,
    messageCount: 6,
    status: 'closed',
    leadSubmitted: true,
  },
  {
    id: 2,
    sessionId: 'sess-002',
    createdAt: '2026-04-07T09:15:00Z',
    updatedAt: '2026-04-07T09:16:00Z',
    messageCount: 2,
    status: 'active',
    leadSubmitted: false,
  },
];

export const mockConversationDetail: ConversationDetailVM = {
  ...mockConversationSummaries[0]!,
  feedbackSummary: { up: 1, down: 0 } as any,
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
};

export const mockConversationListResponse: PaginatedResponse<ConversationSummaryVM> = {
  data: mockConversationSummaries,
  success: true,
  meta: { total: 2, page: 1, pageSize: 20, totalPages: 1 },
};

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
    createdAt: '2026-04-07T08:02:00Z',
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
    createdAt: '2026-04-07T10:10:00Z',
  },
];

export const mockLeadDetail: LeadVM = {
  ...mockLeads[0]!,
  note: '已電話聯繫，對方需要 100 支高壓型過濾器報價',
};

export const mockLeadListResponse: PaginatedResponse<LeadVM> = {
  data: mockLeads,
  success: true,
  meta: { total: 2, page: 1, pageSize: 20, totalPages: 1 },
};

// ── Tickets ───────────────────────────────────────────────────────────────

export const mockTicketNotes: TicketNoteVM[] = [
  {
    id: 'note-001',
    content: '已電話聯繫客戶，確認需求細節',
    createdAt: '2026-04-07T08:30:00Z',
    createdBy: 'admin@example.com',
  },
];

export const mockTicketTimeline: TicketTimelineEvent[] = [
  {
    id: 'tl-001',
    eventType: 'created',
    toStatus: 'open',
    occurredAt: '2026-04-07T08:01:00Z',
    createdBy: 'system',
  },
];

export const mockTickets: TicketVM[] = [
  {
    id: 'ticket-001',
    sessionId: 'sess-001',
    title: '需要人工協助報價',
    summary: '客戶希望確認高壓過濾器交期與報價。',
    priority: 'high',
    status: 'resolved',
    createdAt: '2026-04-07T08:01:00Z',
    resolvedAt: '2026-04-07T08:45:00Z',
  },
  {
    id: 'ticket-002',
    sessionId: 'sess-003',
    title: '產品規格確認',
    summary: '客戶詢問客製化訂製螺絲規格。',
    priority: 'medium',
    status: 'open',
    createdAt: '2026-04-07T10:05:00Z',
  },
];

export const mockTicketDetail: TicketVM = {
  ...mockTickets[0]!,
  notes: mockTicketNotes,
  timeline: mockTicketTimeline,
};

export const mockTicketListResponse: PaginatedResponse<TicketVM> = {
  data: mockTickets,
  success: true,
  meta: { total: 2, page: 1, pageSize: 20, totalPages: 1 },
};

// ── Knowledge Base ────────────────────────────────────────────────────────

export const mockKnowledgeEntries: KnowledgeEntryVM[] = [
  {
    id: 'kb-001',
    title: '過濾器適用液體',
    category: '產品規格',
    status: 'published',
    content: '適用於水、油、化學溶劑等多種工業液體。',
    updatedAt: '2026-03-15T10:00:00Z',
    currentRevision: 3,
  },
  {
    id: 'kb-002',
    title: '如何取得報價',
    category: '訂購流程',
    status: 'draft',
    content: '請提供產品型號、數量與交期需求。',
    updatedAt: '2026-03-18T09:30:00Z',
    currentRevision: 1,
  },
];

export const mockKnowledgeListResponse: PaginatedResponse<KnowledgeEntryVM> = {
  data: mockKnowledgeEntries,
  success: true,
  meta: { total: 2, page: 1, pageSize: 20, totalPages: 1 },
};

export const mockKnowledgeRevisions: KnowledgeRevisionVM[] = [
  {
    revisionId: 'rev-001',
    entryId: 'kb-001',
    revisionNumber: 3,
    content: '適用於水、油、化學溶劑等多種工業液體。',
    updatedAt: '2026-03-15T10:00:00Z',
    note: '補充化學溶劑說明',
  },
];

// ── Intents / Quick Replies / Widget Settings ────────────────────────────

export const mockIntents: IntentVM[] = [
  {
    id: 'intent-001',
    name: 'product-inquiry',
    examples: ['想了解產品', '有哪些規格'],
    keywords: ['產品', '規格'],
    status: 'active',
    sortOrder: 1,
  },
];

export const mockQuickReplies: QuickReplyVM[] = [
  {
    id: 'qr-001',
    label: { 'zh-TW': '產品查詢', en: 'Products' },
    sortOrder: 1,
    status: 'active',
  },
];

export const mockWidgetSettings: WidgetSettingsVM = {
  status: 'online',
  ctaText: { 'zh-TW': 'AI 客服在線', en: 'AI support online' },
  welcomeMessage: { 'zh-TW': '您好，請問需要什麼協助？', en: 'Hi, how can I help?' },
  infoBarText: { 'zh-TW': '通常幾秒內回覆', en: 'Usually replies in seconds' },
  disclaimer: { 'zh-TW': 'AI 回覆僅供參考。', en: 'AI responses are for reference.' },
  quickReplies: { 'zh-TW': ['產品查詢'], en: ['Products'] },
};
