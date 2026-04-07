/**
 * utils/format.ts (T-012)
 *
 * Shared formatting helpers used across chat widget and admin UI.
 */

/**
 * Format a date relative to now.
 *
 * - Within 60 s     → 「剛剛」
 * - Within 60 min   → 「N 分鐘前」
 * - Same calendar day → 「今天 HH:MM」
 * - Previous calendar day → 「昨天 HH:MM」
 * - Earlier         → 「YYYY/MM/DD」
 */
export function formatRelativeTime(date: Date | string | number): string {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)

  if (diffSec < 60) return '剛剛'
  if (diffMin < 60) return `${diffMin} 分鐘前`

  const hhmm = d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000)
  const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate())

  if (dStart.getTime() === todayStart.getTime()) return `今天 ${hhmm}`
  if (dStart.getTime() === yesterdayStart.getTime()) return `昨天 ${hhmm}`

  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}/${mm}/${dd}`
}

/**
 * Format a number with thousands separators.
 * e.g. 1234567 → "1,234,567"
 */
export function formatNumber(n: number): string {
  return n.toLocaleString('zh-TW')
}

/**
 * Truncate a string to `maxLen` characters; append "…" when truncated.
 */
export function truncateText(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen) + '…'
}
