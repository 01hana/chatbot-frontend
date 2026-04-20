/**
 * useFeedback (T-040)
 *
 * Handles the feedback API call for AI messages.
 *
 * Design notes:
 *   - Fire-and-forget: API failure only logs to console, never interrupts the chat.
 *   - Does NOT manage local `rating` state — that stays on ChatMessageVM in the
 *     store and is toggled by the caller (AiMessageItem) optimistically.
 *   - Supports optional `reason` for 'down' votes (sent via a second call after
 *     the user selects a reason chip).
 */

import * as chatApi from '~/services/api/chat'
import { useChatSessionStore } from '~/features/chat/stores/useChatSessionStore'

export function useFeedback() {
  const sessionStore = useChatSessionStore()

  /**
   * Submit feedback for a message.
   * Fire-and-forget: errors are logged but never rethrown.
   *
   * @param messageId - The AI message ID
   * @param value     - 'up' or 'down'
   * @param reason    - Optional reason string for 'down' votes
   */
  async function submitFeedback(
    messageId: string,
    value: 'up' | 'down',
    reason?: string,
  ): Promise<void> {
    const token = sessionStore.sessionToken
    if (!token) return

    try {
      await chatApi.submitFeedback(token, messageId, value, reason)
    } catch (err) {
      console.error('[useFeedback] submitFeedback error', err)
    }
  }

  return { submitFeedback }
}
