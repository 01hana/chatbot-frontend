/**
 * app/features/admin/composables/useFeedbackSummary.ts
 *
 * Computes a feedback summary (thumbs-up count, thumbs-down count,
 * and down-reason distribution) from a list of chat messages.
 */

import type { ChatMessageVM } from '~/types/chat'

export interface FeedbackReason {
  label: string
  count: number
}

export interface FeedbackSummary {
  up: number
  down: number
  reasons: FeedbackReason[]
}

/** Messages may carry an optional `downReason` field not in the base type. */
type MessageWithDownReason = ChatMessageVM & { downReason?: string }

export function useFeedbackSummary() {
  function buildFeedbackSummary(messages: ChatMessageVM[]): FeedbackSummary {
    let up = 0
    let down = 0
    const reasonMap: Record<string, number> = {}

    for (const msg of messages as MessageWithDownReason[]) {
      if (msg.rating === 'up') {
        up++
      } else if (msg.rating === 'down') {
        down++
        const reason = msg.downReason ?? '未指定'
        reasonMap[reason] = (reasonMap[reason] ?? 0) + 1
      }
    }

    const reasons = Object.entries(reasonMap).map(([label, count]) => ({ label, count }))
    return { up, down, reasons }
  }

  return { buildFeedbackSummary }
}
