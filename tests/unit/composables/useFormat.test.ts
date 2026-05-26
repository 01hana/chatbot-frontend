/**
 * tests/unit/composables/useFormat.test.ts
 *
 * Tests for the new methods added to useFormat composable (Phase 3-R).
 * Covers: formatDateTime, formatDateOnly, formatTimeShort.
 * The original formatDate is also exercised to confirm backward compatibility.
 */

import { describe, it, expect } from 'vitest'
import { useFormat } from '../../../app/composables/useFormat'

const { formatDate, formatDateTime, formatDateOnly, formatTimeShort } = useFormat()

const SAMPLE_ISO = '2026-05-19T15:30:00'

describe('formatDate (existing — backward compat)', () => {
  it('returns yyyy-MM-dd when type="date"', () => {
    expect(formatDate(SAMPLE_ISO, 'date')).toBe('2026-05-19')
  })

  it('returns yyyy-MM-dd HH:mm:ss by default', () => {
    expect(formatDate(SAMPLE_ISO)).toBe('2026-05-19 15:30:00')
  })
})

describe('formatDateTime', () => {
  it('formats to yyyy/MM/dd HH:mm', () => {
    expect(formatDateTime(SAMPLE_ISO)).toBe('2026/05/19 15:30')
  })

  it('accepts a Date object', () => {
    const d = new Date(SAMPLE_ISO)
    expect(formatDateTime(d)).toBe('2026/05/19 15:30')
  })
})

describe('formatDateOnly', () => {
  it('formats to yyyy-MM-dd', () => {
    expect(formatDateOnly(SAMPLE_ISO)).toBe('2026-05-19')
  })

  it('accepts a Date object', () => {
    const d = new Date(SAMPLE_ISO)
    expect(formatDateOnly(d)).toBe('2026-05-19')
  })
})

describe('formatTimeShort', () => {
  it('formats to HH:mm', () => {
    expect(formatTimeShort(SAMPLE_ISO)).toBe('15:30')
  })

  it('accepts a Date object', () => {
    const d = new Date(SAMPLE_ISO)
    expect(formatTimeShort(d)).toBe('15:30')
  })

  it('zero-pads hours and minutes', () => {
    expect(formatTimeShort('2026-01-01T08:05:00')).toBe('08:05')
  })
})
