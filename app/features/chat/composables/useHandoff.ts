/**
 * useHandoff (T-038)
 *
 * Manages human-agent handoff for the current chat session.
 *
 * States:
 *   idle        — no handoff in progress
 *   requesting  — POST /api/v1/.../handoff in flight
 *   transferred — backend accepted the handoff (persisted via session store)
 *
 * Design notes:
 *   - `status` is a computed derived from the session store so it survives
 *     component unmount / remount within the same session.
 *   - `isRequesting` is a local transient flag for the async window.
 *   - No polling, no waiting / connected / unavailable states (Phase 3+).
 */

import * as chatApi from '~/services/api/chat'
import { useChatSessionStore } from '~/features/chat/stores/useChatSessionStore'

export function useHandoff() {
  const sessionStore = useChatSessionStore()
  const { t } = useI18n()

  /** Transient flag: true only while the POST is in-flight. */
  const isRequesting = ref(false)

  /** Human-readable error message to surface to the user. */
  const errorMessage = ref<string | null>(null)

  /**
   * Derived display status.
   * - `'requesting'` while the API call is in-flight (local transient)
   * - `'transferred'` once the store reflects a successful handoff
   * - `'idle'` otherwise
   */
  const status = computed<'idle' | 'requesting' | 'transferred'>(() => {
    if (isRequesting.value) return 'requesting'
    return sessionStore.handoffState.status === 'requested' ? 'transferred' : 'idle'
  })

  /**
   * Request a handoff to a human agent.
   * - Guards against duplicate calls.
   * - On acceptance: persists to store (status → 'requested').
   * - On rejection / network error: resets to 'idle', sets errorMessage.
   */
  async function requestHandoff(): Promise<void> {
    if (isRequesting.value || status.value === 'transferred') return

    const token = sessionStore.sessionToken
    if (!token) return

    isRequesting.value = true
    errorMessage.value = null

    try {
      const res = await chatApi.requestHandoff(token)
      if (res.accepted) {
        sessionStore.setHandoffState({
          status: 'requested',
          requestedAt: new Date().toISOString(),
        })
      } else {
        errorMessage.value = res.message || t('handoff.unavailable')
      }
    } catch {
      errorMessage.value = t('handoff.error')
    } finally {
      isRequesting.value = false
    }
  }

  return { status, errorMessage, requestHandoff }
}
