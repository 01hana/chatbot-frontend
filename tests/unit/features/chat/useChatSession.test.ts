/**
 * tests/unit/features/chat/useChatSession.test.ts (T-031)
 *
 * Unit tests for useChatSession composable (T-025).
 *
 * Strategy:
 *  - vi.mock() API modules: createSession, getSessionHistory
 *  - Simulate localStorage via happy-dom's built-in localStorage
 *  - Spin up real Pinia stores with createPinia()
 *  - useChatSession reads/writes localStorage.chat_session_token
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// ── Fixtures ──────────────────────────────────────────────────────────────────
import {
  mockSession,
  mockHistoryMessages,
} from '../../../fixtures/chatFixtures'

// ── Mock vue-i18n (useI18n is called at composable top-level) ─────────────────
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key, locale: { value: 'zh-TW' } }),
}))

// ── Mock API ──────────────────────────────────────────────────────────────────
const mockCreateSession = vi.fn()
const mockGetSessionHistory = vi.fn()

vi.mock('~/services/api/chat', () => ({
  createSession: (...args: unknown[]) => mockCreateSession(...args),
  getSessionHistory: (...args: unknown[]) => mockGetSessionHistory(...args),
  getStreamUrl: vi.fn(() => ''),
  cancelStream: vi.fn(() => Promise.resolve()),
}))

// ── Store + composable imports ─────────────────────────────────────────────────
import { useChatSessionStore } from '../../../../app/features/chat/stores/useChatSessionStore'
import { useChatWidgetStore } from '../../../../app/features/chat/stores/useChatWidgetStore'
import { useWidgetConfigStore } from '../../../../app/features/chat/stores/useWidgetConfigStore'
import { useChatSession } from '../../../../app/features/chat/composables/useChatSession'

const LS_KEY = 'chat_session_token'

// ── Helpers ───────────────────────────────────────────────────────────────────

function setupPinia() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return {
    sessionStore: useChatSessionStore(),
    widgetStore: useChatWidgetStore(),
    configStore: useWidgetConfigStore(),
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useChatSession', () => {
  beforeEach(() => {
    localStorage.clear()
    mockCreateSession.mockReset()
    mockGetSessionHistory.mockReset()
    // Default happy-path mocks
    mockCreateSession.mockResolvedValue(mockSession)
    mockGetSessionHistory.mockResolvedValue(mockHistoryMessages)
    setupPinia()
  })

  afterEach(() => {
    localStorage.clear()
  })

  // ── Case 1: localStorage 無 token ─────────────────────────────────────────

  describe('localStorage 無 token', () => {
    it('建立新 session，sessionToken 寫入 localStorage', async () => {
      expect(localStorage.getItem(LS_KEY)).toBeNull()

      const { initSession } = useChatSession()
      await initSession()

      expect(mockCreateSession).toHaveBeenCalledOnce()
      expect(localStorage.getItem(LS_KEY)).toBe(mockSession.sessionToken)
    })

    it('sessionStore.sessionToken 設為新 token', async () => {
      const { initSession } = useChatSession()
      await initSession()

      const sessionStore = useChatSessionStore()
      expect(sessionStore.sessionToken).toBe(mockSession.sessionToken)
    })

    it('sessionStatus 設為 active', async () => {
      const { initSession } = useChatSession()
      await initSession()

      const sessionStore = useChatSessionStore()
      expect(sessionStore.sessionStatus).toBe('active')
    })

    it('append 歡迎訊息（type ai）到 messages', async () => {
      const { initSession } = useChatSession()
      await initSession()

      const sessionStore = useChatSessionStore()
      expect(sessionStore.messages.length).toBeGreaterThan(0)
      expect(sessionStore.messages[0].type).toBe('ai')
    })
  })

  // ── Case 2: localStorage 有 token，API 回傳歷史訊息 ───────────────────────

  describe('localStorage 有 token，API 成功', () => {
    beforeEach(() => {
      localStorage.setItem(LS_KEY, mockSession.sessionToken)
    })

    it('呼叫 getSessionHistory 而非 createSession', async () => {
      const { initSession } = useChatSession()
      await initSession()

      expect(mockGetSessionHistory).toHaveBeenCalledWith(mockSession.sessionToken)
      expect(mockCreateSession).not.toHaveBeenCalled()
    })

    it('歷史訊息 restore 至 sessionStore.messages', async () => {
      const { initSession } = useChatSession()
      await initSession()

      const sessionStore = useChatSessionStore()
      expect(sessionStore.messages.length).toBe(mockHistoryMessages.length)
      expect(sessionStore.messages[0].id).toBe(mockHistoryMessages[0].id)
    })

    it('sessionStore.sessionToken 保持為現有 token', async () => {
      const { initSession } = useChatSession()
      await initSession()

      const sessionStore = useChatSessionStore()
      expect(sessionStore.sessionToken).toBe(mockSession.sessionToken)
    })

    it('sessionStatus 設為 active', async () => {
      const { initSession } = useChatSession()
      await initSession()

      const sessionStore = useChatSessionStore()
      expect(sessionStore.sessionStatus).toBe('active')
    })
  })

  // ── Case 3: localStorage 有 token，API 回 401 ─────────────────────────────

  describe('localStorage 有 token，API 回 401', () => {
    beforeEach(() => {
      localStorage.setItem(LS_KEY, 'stale-token')
      const err = Object.assign(new Error('Unauthorized'), { response: { status: 401 } })
      mockGetSessionHistory.mockRejectedValue(err)
    })

    it('清除 localStorage token', async () => {
      const { initSession } = useChatSession()
      await initSession()

      expect(localStorage.getItem(LS_KEY)).not.toBe('stale-token')
    })

    it('建立新 session（呼叫 createSession）', async () => {
      const { initSession } = useChatSession()
      await initSession()

      expect(mockCreateSession).toHaveBeenCalledOnce()
    })

    it('新 token 寫入 localStorage', async () => {
      const { initSession } = useChatSession()
      await initSession()

      expect(localStorage.getItem(LS_KEY)).toBe(mockSession.sessionToken)
    })
  })

  // ── Case 4: localStorage 有 token，API 回 404 ─────────────────────────────

  describe('localStorage 有 token，API 回 404', () => {
    beforeEach(() => {
      localStorage.setItem(LS_KEY, 'expired-token')
      const err = Object.assign(new Error('Not Found'), { response: { status: 404 } })
      mockGetSessionHistory.mockRejectedValue(err)
    })

    it('清除 localStorage token 並重建 session', async () => {
      const { initSession } = useChatSession()
      await initSession()

      expect(localStorage.getItem(LS_KEY)).toBe(mockSession.sessionToken)
      expect(mockCreateSession).toHaveBeenCalledOnce()
    })
  })

  // ── Case 5: restartSession ────────────────────────────────────────────────

  describe('restartSession()', () => {
    it('清除舊 session 並建立新 session', async () => {
      // Seed existing session
      localStorage.setItem(LS_KEY, mockSession.sessionToken)
      const sessionStore = useChatSessionStore()
      sessionStore.setSessionToken(mockSession.sessionToken)
      sessionStore.setSessionStatus('active')

      const { restartSession } = useChatSession()
      await restartSession()

      // Store should be reset and re-initialised
      expect(mockCreateSession).toHaveBeenCalledOnce()
      expect(sessionStore.sessionStatus).toBe('active')
    })

    it('clearSession は store を reset する', async () => {
      localStorage.setItem(LS_KEY, mockSession.sessionToken)
      const sessionStore = useChatSessionStore()
      sessionStore.setSessionToken(mockSession.sessionToken)
      sessionStore.setSessionStatus('active')

      const { clearSession } = useChatSession()
      clearSession()

      expect(sessionStore.sessionToken).toBeNull()
      expect(sessionStore.sessionStatus).toBe('idle')
      expect(localStorage.getItem(LS_KEY)).toBeNull()
    })

    it('restartSession 後 localStorage に新 token が書かれる', async () => {
      localStorage.setItem(LS_KEY, 'old-token')

      const { restartSession } = useChatSession()
      await restartSession()

      expect(localStorage.getItem(LS_KEY)).toBe(mockSession.sessionToken)
    })
  })

  // ── Guard: already active ─────────────────────────────────────────────────

  it('initSession を複数回呼ぶと 2 回目はスキップ（already active）', async () => {
    const sessionStore = useChatSessionStore()
    sessionStore.setSessionStatus('active')

    const { initSession } = useChatSession()
    await initSession()

    expect(mockCreateSession).not.toHaveBeenCalled()
    expect(mockGetSessionHistory).not.toHaveBeenCalled()
  })
})
