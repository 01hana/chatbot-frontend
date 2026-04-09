/**
 * useWidgetConfig (T-026)
 *
 * Loads the Widget configuration whenever the chat panel opens.
 *
 * Flow:
 *   Widget isOpen → true  →  fetchConfig()
 *     Success              →  store config, set isOnline
 *     status === 'offline' →  setMode('fallback') + start 60s retry
 *     API failure          →  setMode('fallback') + start 60s retry
 *   Widget isOpen → false →  stop retry timer
 *
 * No localStorage caching – config is re-fetched on every open.
 */

import { createChatClient } from '~/services/api/client'
import type { WidgetConfigVM } from '~/types/chat'
import type { ApiResponse } from '~/types/api'

const RETRY_INTERVAL_MS = 60_000

export function useWidgetConfig() {
  const widgetStore = useChatWidgetStore()
  const configStore = useWidgetConfigStore()

  let _retryTimer: ReturnType<typeof setInterval> | null = null

  // ── Fetch ─────────────────────────────────────────────────────────────────

  async function fetchConfig(): Promise<void> {
    try {
      const client = createChatClient()
      const res = await client<ApiResponse<WidgetConfigVM>>('/api/widget/config', {
        method: 'GET',
      })
      const cfg = res.data
      configStore.setConfig(cfg)

      if (cfg.status === 'offline') {
        _enterFallback()
      } else {
        _exitFallback()
      }
    } catch (err) {
      console.warn('[useWidgetConfig] config fetch failed – entering fallback', err)
      configStore.setOffline()
      _enterFallback()
    }
  }

  // ── Fallback helpers ──────────────────────────────────────────────────────

  function _enterFallback() {
    widgetStore.setMode('fallback')
    _startRetry()
  }

  function _exitFallback() {
    widgetStore.setMode('normal')
    _stopRetry()
  }

  function _startRetry() {
    if (_retryTimer !== null) return // already running
    _retryTimer = setInterval(async () => {
      await fetchConfig()
      // fetchConfig itself calls _exitFallback when it succeeds
    }, RETRY_INTERVAL_MS)
  }

  function _stopRetry() {
    if (_retryTimer !== null) {
      clearInterval(_retryTimer)
      _retryTimer = null
    }
  }

  // ── Watch widget open state ───────────────────────────────────────────────

  // watch(
  //   () => widgetStore.isOpen,
  //   async (open) => {
  //     if (open) {
  //       await fetchConfig()
  //     } else {
  //       _stopRetry()
  //     }
  //   },
  //   { immediate: false },
  // )

  // Cleanup on component unmount (when used inside ChatWidget)
  onUnmounted(() => {
    _stopRetry()
  })

  return {
    config: computed(() => configStore.config),
    isLoaded: computed(() => configStore.isLoaded),
    isOnline: computed(() => configStore.isOnline),
    isFallback: computed(() => widgetStore.mode === 'fallback'),

    fetchConfig,
  }
}
