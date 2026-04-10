/**
 * tests/unit/features/chat/useWidgetConfig.test.ts (T-032)
 *
 * Unit tests for useWidgetConfig composable (T-026).
 *
 * Strategy:
 *  - vi.mock() the API client so fetchConfig() doesn't do real HTTP
 *  - Spin up real Pinia stores with createPinia()
 *  - Use vi.useFakeTimers() to control the 60-second retry interval
 *  - Confirm localStorage is NOT written (config is never cached)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// ── Fixtures ──────────────────────────────────────────────────────────────────
import {
  mockWidgetConfig,
  mockOfflineWidgetConfig,
  mockWidgetConfigResponse,
} from '../../../fixtures/chatFixtures'
import type { ApiResponse } from '../../../../app/types/api'
import type { WidgetConfigVM } from '../../../../app/types/chat'

// ── Mock the API client ───────────────────────────────────────────────────────
// useWidgetConfig calls createChatClient() and then client('/api/widget/config')
const mockClientFetch = vi.fn()

vi.mock('~/services/api/client', () => ({
  createChatClient: () => mockClientFetch,
  createAdminClient: () => mockClientFetch,
}))

// ── Store + composable imports ────────────────────────────────────────────────
import { useChatWidgetStore } from '../../../../app/features/chat/stores/useChatWidgetStore'
import { useWidgetConfigStore } from '../../../../app/features/chat/stores/useWidgetConfigStore'
import { useWidgetConfig } from '../../../../app/features/chat/composables/useWidgetConfig'

// ── Helper ────────────────────────────────────────────────────────────────────

function setupPinia() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return {
    widgetStore: useChatWidgetStore(),
    configStore: useWidgetConfigStore(),
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useWidgetConfig', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    mockClientFetch.mockReset()
    setupPinia()
  })

  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  // ── Case 1: fetchConfig 成功 ──────────────────────────────────────────────

  describe('fetchConfig 成功', () => {
    beforeEach(() => {
      mockClientFetch.mockResolvedValue(mockWidgetConfigResponse satisfies ApiResponse<WidgetConfigVM>)
    })

    it('config 存入 configStore', async () => {
      const { fetchConfig } = useWidgetConfig()
      await fetchConfig()

      const configStore = useWidgetConfigStore()
      expect(configStore.config).toEqual(mockWidgetConfig)
    })

    it('isLoaded 設為 true', async () => {
      const { fetchConfig } = useWidgetConfig()
      await fetchConfig()

      const configStore = useWidgetConfigStore()
      expect(configStore.isLoaded).toBe(true)
    })

    it('isOnline 設為 true（status: online）', async () => {
      const { fetchConfig } = useWidgetConfig()
      await fetchConfig()

      const configStore = useWidgetConfigStore()
      expect(configStore.isOnline).toBe(true)
    })

    it('widgetStore.mode 為 normal', async () => {
      const { fetchConfig } = useWidgetConfig()
      await fetchConfig()

      const widgetStore = useChatWidgetStore()
      expect(widgetStore.mode).toBe('normal')
    })

    it('不寫入 localStorage（每次重新取得）', async () => {
      const { fetchConfig } = useWidgetConfig()
      await fetchConfig()

      // No widget config key should exist in localStorage
      expect(localStorage.getItem('widget_config')).toBeNull()
      expect(localStorage.getItem('widgetConfig')).toBeNull()
      // Double-check nothing at all was stored
      expect(localStorage.length).toBe(0)
    })
  })

  // ── Case 2: status: 'offline' → 降級模式 ─────────────────────────────────

  describe('config status: offline', () => {
    beforeEach(() => {
      mockClientFetch.mockResolvedValue({
        data: mockOfflineWidgetConfig,
        success: true,
      } satisfies ApiResponse<WidgetConfigVM>)
    })

    it('widgetStore.mode 設為 fallback', async () => {
      const { fetchConfig } = useWidgetConfig()
      await fetchConfig()

      const widgetStore = useChatWidgetStore()
      expect(widgetStore.mode).toBe('fallback')
    })

    it('configStore.isOnline 設為 false', async () => {
      const { fetchConfig } = useWidgetConfig()
      await fetchConfig()

      const configStore = useWidgetConfigStore()
      expect(configStore.isOnline).toBe(false)
    })
  })

  // ── Case 3: API 失敗 → fallback + retry ──────────────────────────────────

  describe('API 失敗', () => {
    beforeEach(() => {
      mockClientFetch.mockRejectedValue(new Error('network error'))
    })

    it('widgetStore.mode 設為 fallback', async () => {
      const { fetchConfig } = useWidgetConfig()
      await fetchConfig()

      const widgetStore = useChatWidgetStore()
      expect(widgetStore.mode).toBe('fallback')
    })

    it('configStore.isOnline 設為 false', async () => {
      const { fetchConfig } = useWidgetConfig()
      await fetchConfig()

      const configStore = useWidgetConfigStore()
      expect(configStore.isOnline).toBe(false)
    })

    it('不寫入 localStorage', async () => {
      const { fetchConfig } = useWidgetConfig()
      await fetchConfig()

      expect(localStorage.length).toBe(0)
    })
  })

  // ── Case 4: 60 秒 retry timer ─────────────────────────────────────────────

  describe('降級後 60 秒重新探測', () => {
    it('fetchConfig 被呼叫後 60 秒後重試一次', async () => {
      // First call fails → enters fallback + starts retry timer
      mockClientFetch.mockRejectedValueOnce(new Error('offline'))
      // Second call (from timer) succeeds
      mockClientFetch.mockResolvedValueOnce(mockWidgetConfigResponse)

      const { fetchConfig } = useWidgetConfig()
      await fetchConfig()

      expect(mockClientFetch).toHaveBeenCalledTimes(1)

      // Advance fake timer by 60 s to trigger interval
      await vi.advanceTimersByTimeAsync(60_000)

      expect(mockClientFetch).toHaveBeenCalledTimes(2)
    })

    it('恢復後 widgetStore.mode 設為 normal', async () => {
      mockClientFetch
        .mockRejectedValueOnce(new Error('offline'))
        .mockResolvedValueOnce(mockWidgetConfigResponse)

      const { fetchConfig } = useWidgetConfig()
      await fetchConfig()

      const widgetStore = useChatWidgetStore()
      expect(widgetStore.mode).toBe('fallback')

      await vi.advanceTimersByTimeAsync(60_000)

      expect(widgetStore.mode).toBe('normal')
    })

    it('retry timer 只啟動一次（多次呼叫 fetchConfig 不重複建立 timer）', async () => {
      mockClientFetch.mockRejectedValue(new Error('offline'))

      const { fetchConfig } = useWidgetConfig()
      await fetchConfig()
      await fetchConfig() // second call – should not add another timer

      // Advance 60 s: timer fires once
      await vi.advanceTimersByTimeAsync(60_000)

      // Total calls: 2 initial + 1 timer = 3 (not 4)
      expect(mockClientFetch).toHaveBeenCalledTimes(3)
    })
  })
})
