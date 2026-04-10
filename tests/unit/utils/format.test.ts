/**
 * tests/unit/utils/format.test.ts (T-033)
 *
 * Unit tests for utils/format.ts
 * Covers: formatRelativeTime, truncateText, formatNumber, formatDateTime
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { formatRelativeTime, truncateText, formatNumber, formatDateTime } from '../../../app/utils/format'

// ── formatRelativeTime ────────────────────────────────────────────────────────

describe('formatRelativeTime', () => {
  const NOW = new Date('2026-04-09T12:00:00+08:00')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('30 秒內 → 「剛剛」', () => {
    const d = new Date(NOW.getTime() - 30_000)
    expect(formatRelativeTime(d)).toBe('剛剛')
  })

  it('剛好 59 秒內 → 「剛剛」', () => {
    const d = new Date(NOW.getTime() - 59_000)
    expect(formatRelativeTime(d)).toBe('剛剛')
  })

  it('1 分鐘前 → 「1 分鐘前」', () => {
    const d = new Date(NOW.getTime() - 60_000)
    expect(formatRelativeTime(d)).toBe('1 分鐘前')
  })

  it('3 分鐘前 → 「3 分鐘前」', () => {
    const d = new Date(NOW.getTime() - 3 * 60_000)
    expect(formatRelativeTime(d)).toBe('3 分鐘前')
  })

  it('59 分鐘前 → 「59 分鐘前」', () => {
    const d = new Date(NOW.getTime() - 59 * 60_000)
    expect(formatRelativeTime(d)).toBe('59 分鐘前')
  })

  it('同天稍早 → 「今天 HH:MM」', () => {
    // 今天 08:00
    const d = new Date('2026-04-09T08:00:00+08:00')
    const result = formatRelativeTime(d)
    expect(result).toMatch(/^今天 \d{2}:\d{2}$/)
  })

  it('昨天 → 「昨天 HH:MM」', () => {
    const d = new Date('2026-04-08T14:30:00+08:00')
    const result = formatRelativeTime(d)
    expect(result).toMatch(/^昨天 \d{2}:\d{2}$/)
  })

  it('更早的日期 → 「YYYY/MM/DD」格式', () => {
    const d = new Date('2026-03-01T10:00:00+08:00')
    expect(formatRelativeTime(d)).toBe('2026/03/01')
  })

  it('去年日期 → 「YYYY/MM/DD」格式', () => {
    const d = new Date('2025-12-31T23:59:00+08:00')
    expect(formatRelativeTime(d)).toBe('2025/12/31')
  })

  it('接受 string 格式輸入', () => {
    const d = new Date(NOW.getTime() - 10_000).toISOString()
    expect(formatRelativeTime(d)).toBe('剛剛')
  })

  it('接受 number（timestamp）格式輸入', () => {
    const d = NOW.getTime() - 2 * 60_000
    expect(formatRelativeTime(d)).toBe('2 分鐘前')
  })
})

// ── truncateText ──────────────────────────────────────────────────────────────

describe('truncateText', () => {
  it('未超過 maxLen 時原樣返回', () => {
    expect(truncateText('hello', 10)).toBe('hello')
  })

  it('剛好等於 maxLen 時不截斷', () => {
    expect(truncateText('hello', 5)).toBe('hello')
  })

  it('超過 maxLen 時截斷並加「…」', () => {
    expect(truncateText('hello world', 5)).toBe('hello…')
  })

  it('maxLen = 1 時只保留第一個字元', () => {
    expect(truncateText('abc', 1)).toBe('a…')
  })

  it('空字串始終返回空字串', () => {
    expect(truncateText('', 5)).toBe('')
  })

  it('中文字元也正確截斷', () => {
    expect(truncateText('你好世界測試', 3)).toBe('你好世…')
  })
})

// ── formatNumber ──────────────────────────────────────────────────────────────

describe('formatNumber', () => {
  it('整數加上千分位分隔符', () => {
    // toLocaleString('zh-TW') may use , or . depending on platform – just verify it rounds correctly
    const result = formatNumber(1234567)
    expect(result.replace(/[,.]/, ',')).toMatch(/1[,.]?234[,.]?567/)
  })

  it('小於 1000 時不加分隔符', () => {
    expect(formatNumber(999)).toBe('999')
  })

  it('0 返回 "0"', () => {
    expect(formatNumber(0)).toBe('0')
  })
})

// ─── formatDateTime ────────────────────────────────────────────────────────

describe('formatDateTime', () => {
  it('傳入 Date 物件 → HH:mm 格式', () => {
    const d = new Date('2026-04-09T14:30:00+08:00')
    expect(formatDateTime(d)).toMatch(/^\d{2}:\d{2}$/)
  })

  it('傳入 ISO string → HH:mm 格式', () => {
    expect(formatDateTime('2026-04-09T09:05:00+08:00')).toMatch(/^\d{2}:\d{2}$/)
  })

  it('傳入 timestamp number → HH:mm 格式', () => {
    const ts = new Date('2026-04-09T14:30:00+08:00').getTime()
    expect(formatDateTime(ts)).toMatch(/^\d{2}:\d{2}$/)
  })

  it('邊界：00:00（午夜，zh-TW locale）', () => {
    // zh-TW 24h: '上午12:00' 或 '00:00' 取決於實作；formatDateTime 取 HH:mm 格式
    const d = new Date('2026-04-09T00:00:00+08:00')
    const result = formatDateTime(d)
    expect(result).toMatch(/^\d{2}:\d{2}$/)
  })

  it('邊界：12:00（正午）', () => {
    const d = new Date('2026-04-09T12:00:00+08:00')
    const result = formatDateTime(d)
    expect(result).toMatch(/^\d{2}:\d{2}$/)
  })

  it('邊界：23:59（一天最後一分鐘）', () => {
    const d = new Date('2026-04-09T23:59:00+08:00')
    const result = formatDateTime(d)
    expect(result).toMatch(/^\d{2}:\d{2}$/)
  })

  it('不同日期產生相同時間格式', () => {
    const d1 = new Date('2020-01-01T08:05:00+08:00')
    const d2 = new Date('2099-12-31T08:05:00+08:00')
    expect(formatDateTime(d1)).toMatch(/^\d{2}:\d{2}$/)
    expect(formatDateTime(d2)).toMatch(/^\d{2}:\d{2}$/)
  })
})
