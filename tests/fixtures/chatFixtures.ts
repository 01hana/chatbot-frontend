/**
 * tests/fixtures/chatFixtures.ts (T-014 / T-035)
 *
 * Typed mock data for chat API responses used in unit and E2E tests.
 */

import type {
  ChatMessageVM,
  ChatSessionVM,
  WidgetConfigVM,
  QuickReplyItem,
  LeadFormData,
  HandoffResponse,
  HistoryMessageDTO,
  SessionHistoryResponse,
} from '../../app/types/chat'
import type { ApiResponse } from '../../app/types/api'

// ── Widget Config ─────────────────────────────────────────────────────────

export const mockWidgetConfig: WidgetConfigVM = {
  status: 'online',
  ctaText: { 'zh-TW': '有什麼我可以幫您？', en: 'How can I help you?' },
  welcomeMessage: { 'zh-TW': '您好！我是震南的 AI 客服助理。', en: 'Hello! I am your AI assistant.' },
  disclaimer: { 'zh-TW': '本服務由 AI 提供，僅供參考。', en: 'This service is AI-powered.' },
  serviceHours: { 'zh-TW': '週一至週五 09:00–18:00', en: 'Mon–Fri 09:00–18:00' },
  quickReplies: [
    { 'zh-TW': '如何訂購？', en: 'How to order?' },
    { 'zh-TW': '出貨時間？', en: 'Shipping time?' },
    { 'zh-TW': '聯絡我們', en: 'Contact us' },
  ] satisfies QuickReplyItem[],
}

export const mockOfflineWidgetConfig: WidgetConfigVM = {
  ...mockWidgetConfig,
  status: 'offline',
}

export const mockDegradedWidgetConfig: WidgetConfigVM = {
  ...mockWidgetConfig,
  status: 'degraded',
}

// ── Chat Session ──────────────────────────────────────────────────────────

export const mockSession: ChatSessionVM = {
  sessionToken: 'mock-session-token-abc123',
  status: 'active',
  createdAt: new Date('2026-04-07T08:00:00Z').toISOString(),
  expiresAt: new Date('2026-04-07T20:00:00Z').toISOString(),
}

// ── Messages ──────────────────────────────────────────────────────────────

export const mockUserMessage: ChatMessageVM = {
  id: 'msg-user-1',
  type: 'user',
  content: '如何訂購？',
  timestamp: new Date('2026-04-07T08:01:00Z').toISOString(),
}

export const mockAiMessage: ChatMessageVM = {
  id: 'msg-ai-1',
  type: 'ai',
  content: '您好！您可以透過以下步驟完成訂購：\n\n1. 選擇商品\n2. 加入購物車\n3. 結帳付款',
  timestamp: new Date('2026-04-07T08:01:05Z').toISOString(),
  metadata: { confidence: 0.95 },
}

export const mockHistoryMessages: ChatMessageVM[] = [mockUserMessage, mockAiMessage]

/** Backend DTO format returned by GET /history (before mapping to VM). */
export const mockHistoryDTOs: HistoryMessageDTO[] = [
  {
    id: 'msg-user-1',
    role: 'user',
    content: '如何訂購？',
    createdAt: new Date('2026-04-07T08:01:00Z').toISOString(),
  },
  {
    id: 'msg-ai-1',
    role: 'assistant',
    content: '您好！您可以透過以下步驟完成訂購：\n\n1. 選擇商品\n2. 加入購物車\n3. 結帳付款',
    createdAt: new Date('2026-04-07T08:01:05Z').toISOString(),
  },
]

/** Full SessionHistoryResponse as returned by getSessionHistory(). */
export const mockHistorySessionResponse: SessionHistoryResponse = {
  sessionToken: mockSession.sessionToken,
  messages: mockHistoryDTOs,
}

// ── API Response Wrappers ─────────────────────────────────────────────────

export const mockSessionResponse: ApiResponse<ChatSessionVM> = {
  data: mockSession,
  success: true,
}

export const mockHistoryResponse: ApiResponse<ChatMessageVM[]> = {
  data: mockHistoryMessages,
  success: true,
}

export const mockWidgetConfigResponse: ApiResponse<WidgetConfigVM> = {
  data: mockWidgetConfig,
  success: true,
}

// ── Streaming / Cancel ────────────────────────────────────────────────────

/** Mock SSE stream URL returned by getStreamUrl(). */
export const mockStreamUrl =
  'http://localhost:3001/api/v1/chat/sessions/mock-session-token-abc123/messages?message=%E5%A6%82%E4%BD%95%E8%A8%82%E8%B3%BC%EF%BC%9F'

/** Simulated token sequence emitted by the mock streaming service. */
export const mockTokenSequence = ['您', '好', '！', '以', '下', '是', '訂', '購', '步', '驟', '：']

// ── Mock createSession / cancelStream helpers ─────────────────────────────

export function mockCreateSession() {
  return Promise.resolve(mockSession)
}

export function mockGetSessionHistory() {
  return Promise.resolve(mockHistoryMessages)
}

export function mockCancelStream() {
  return Promise.resolve()
}

// ── Lead Form fixtures (T-035) ─────────────────────────────────────────────

/** A valid lead form payload (all required fields filled). */
export const mockLeadFormData: LeadFormData = {
  name: '王小明',
  email: 'xiaoming.wang@example.com',
  company: '震南實業',
  phone: '0912-345-678',
  message: '想了解產品報價',
  language: 'zh-TW',
}

/** Minimal lead form payload (only required fields). */
export const mockLeadFormDataMinimal: LeadFormData = {
  name: '張三',
  email: 'zhang.san@example.com',
  language: 'zh-TW',
}

/** API response from POST /api/v1/chat/sessions/:token/lead. */
export const mockLeadResponse: ApiResponse<{ leadId: string }> = {
  data: { leadId: 'lead-abc-001' },
  success: true,
}

/** Mock submitLead — resolves with mockLeadResponse. */
export function mockSubmitLead(_sessionToken: string, _data: LeadFormData) {
  return Promise.resolve(mockLeadResponse)
}

// ── Handoff fixtures (T-035) ──────────────────────────────────────────────

/** Response from POST /api/v1/chat/sessions/:token/handoff (accepted). */
export const mockHandoffResponse: HandoffResponse = {
  accepted: true,
  action: 'transfer',
  ticketId: 'ticket-xyz-001',
  message: '已轉交專人協助，請稍候。',
}

/** Response from POST .../handoff when unavailable. */
export const mockHandoffUnavailableResponse: HandoffResponse = {
  accepted: false,
  action: 'unavailable',
  message: '目前非服務時間，請留下聯絡方式。',
}

/** Mock requestHandoff — resolves with mockHandoffResponse. */
export function mockRequestHandoff(_sessionToken: string) {
  return Promise.resolve(mockHandoffResponse)
}

// ── Feedback fixtures (T-035) ─────────────────────────────────────────────

/** Mock submitFeedback — resolves with void. */
export function mockSubmitFeedback(
  _sessionToken: string,
  _messageId: string,
  _value: 'up' | 'down',
  _reason?: string,
) {
  return Promise.resolve()
}
