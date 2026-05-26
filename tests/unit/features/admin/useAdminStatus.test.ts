/**
 * tests/unit/features/admin/useAdminStatus.test.ts
 *
 * Unit tests for useAdminStatus composable.
 * Pure function calls — no Vue instance needed.
 */

import { describe, it, expect } from 'vitest'
import { useAdminStatus } from '../../../../app/features/admin/composables/useAdminStatus'

const { getAdminStatusColor, getAdminStatusLabel, getTicketStatusLabel, getLeadStatusLabel } =
  useAdminStatus()

describe('getAdminStatusColor', () => {
  it('active → success', () => expect(getAdminStatusColor('active')).toBe('success'))
  it('approved → success', () => expect(getAdminStatusColor('approved')).toBe('success'))
  it('resolved → success', () => expect(getAdminStatusColor('resolved')).toBe('success'))
  it('qualified → success', () => expect(getAdminStatusColor('qualified')).toBe('success'))

  it('inactive → neutral', () => expect(getAdminStatusColor('inactive')).toBe('neutral'))
  it('archived → neutral', () => expect(getAdminStatusColor('archived')).toBe('neutral'))
  it('closed → neutral', () => expect(getAdminStatusColor('closed')).toBe('neutral'))

  it('pending → warning', () => expect(getAdminStatusColor('pending')).toBe('warning'))
  it('draft → warning', () => expect(getAdminStatusColor('draft')).toBe('warning'))
  it('in_progress → warning', () => expect(getAdminStatusColor('in_progress')).toBe('warning'))
  it('handoff → warning', () => expect(getAdminStatusColor('handoff')).toBe('warning'))

  it('error → error', () => expect(getAdminStatusColor('error')).toBe('error'))
  it('failed → error', () => expect(getAdminStatusColor('failed')).toBe('error'))

  it('open → info', () => expect(getAdminStatusColor('open')).toBe('info'))
  it('new → info', () => expect(getAdminStatusColor('new')).toBe('info'))

  it('unknown status falls back to neutral', () =>
    expect(getAdminStatusColor('anything_unknown')).toBe('neutral'))
})

describe('getAdminStatusLabel', () => {
  it('active → "Active"', () => expect(getAdminStatusLabel('active')).toBe('Active'))
  it('closed → "已關閉"', () => expect(getAdminStatusLabel('closed')).toBe('已關閉'))
  it('handoff → "轉人工"', () => expect(getAdminStatusLabel('handoff')).toBe('轉人工'))
  it('unknown status returns status string as-is', () =>
    expect(getAdminStatusLabel('xyz')).toBe('xyz'))
})

describe('getTicketStatusLabel', () => {
  it('open → "開啟"', () => expect(getTicketStatusLabel('open')).toBe('開啟'))
  it('in_progress → "處理中"', () => expect(getTicketStatusLabel('in_progress')).toBe('處理中'))
  it('resolved → "已解決"', () => expect(getTicketStatusLabel('resolved')).toBe('已解決'))
  it('closed → "已關閉"', () => expect(getTicketStatusLabel('closed')).toBe('已關閉'))
  it('unknown falls back to getAdminStatusLabel', () =>
    expect(getTicketStatusLabel('active')).toBe('Active'))
})

describe('getLeadStatusLabel', () => {
  it('new → "新增"', () => expect(getLeadStatusLabel('new')).toBe('新增'))
  it('contacted → "已聯繫"', () => expect(getLeadStatusLabel('contacted')).toBe('已聯繫'))
  it('qualified → "已評估"', () => expect(getLeadStatusLabel('qualified')).toBe('已評估'))
  it('closed → "已關閉"', () => expect(getLeadStatusLabel('closed')).toBe('已關閉'))
  it('unknown falls back to getAdminStatusLabel', () =>
    expect(getLeadStatusLabel('active')).toBe('Active'))
})
