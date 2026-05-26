/**
 * tests/unit/features/admin/useFeedbackSummary.test.ts
 *
 * Unit tests for useFeedbackSummary composable.
 */

import { describe, it, expect } from 'vitest'
import { useFeedbackSummary } from '../../../../app/features/admin/composables/useFeedbackSummary'
import type { ChatMessageVM } from '../../../../app/types/chat'

const { buildFeedbackSummary } = useFeedbackSummary()

function makeMsg(
  partial: Partial<ChatMessageVM> & { downReason?: string },
): ChatMessageVM & { downReason?: string } {
  return {
    id: '1',
    type: 'ai',
    content: '',
    timestamp: new Date().toISOString(),
    ...partial,
  }
}

describe('buildFeedbackSummary', () => {
  it('returns zeros for empty messages', () => {
    const result = buildFeedbackSummary([])
    expect(result).toEqual({ up: 0, down: 0, reasons: [] })
  })

  it('counts thumbs-up ratings', () => {
    const msgs = [
      makeMsg({ rating: 'up' }),
      makeMsg({ rating: 'up' }),
      makeMsg({ type: 'user' }),
    ]
    const { up, down } = buildFeedbackSummary(msgs)
    expect(up).toBe(2)
    expect(down).toBe(0)
  })

  it('counts thumbs-down ratings', () => {
    const msgs = [makeMsg({ rating: 'down' }), makeMsg({ rating: 'down' })]
    const { up, down } = buildFeedbackSummary(msgs)
    expect(up).toBe(0)
    expect(down).toBe(2)
  })

  it('groups down reasons', () => {
    const msgs = [
      makeMsg({ rating: 'down', downReason: '答非所問' }),
      makeMsg({ rating: 'down', downReason: '答非所問' }),
      makeMsg({ rating: 'down', downReason: '內容不正確' }),
    ]
    const { down, reasons } = buildFeedbackSummary(msgs)
    expect(down).toBe(3)
    expect(reasons).toContainEqual({ label: '答非所問', count: 2 })
    expect(reasons).toContainEqual({ label: '內容不正確', count: 1 })
  })

  it('uses "未指定" when downReason is absent', () => {
    const msgs = [makeMsg({ rating: 'down' })]
    const { reasons } = buildFeedbackSummary(msgs)
    expect(reasons).toContainEqual({ label: '未指定', count: 1 })
  })

  it('ignores messages without a rating', () => {
    const msgs = [makeMsg({ type: 'user' }), makeMsg({ type: 'ai' })]
    const result = buildFeedbackSummary(msgs)
    expect(result).toEqual({ up: 0, down: 0, reasons: [] })
  })
})
