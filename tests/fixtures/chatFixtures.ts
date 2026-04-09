/**
 * tests/fixtures/chatFixtures.ts (T-014)
 *
 * Typed mock data for chat API responses used in unit and E2E tests.
 */

import type {
  ChatMessageVM,
  ChatSessionVM,
  WidgetConfigVM,
  QuickReplyItem,
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
  'http://localhost:3000/api/chat/session/mock-session-token-abc123/stream?message=%E5%A6%82%E4%BD%95%E8%A8%82%E8%B3%BC%EF%BC%9F'

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
