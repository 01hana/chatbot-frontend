/**
 * utils/analytics.ts (T-012)
 *
 * Client-side analytics event tracking skeleton.
 * Currently logs to console; the real API POST is pre-wired for Phase 2 (T-043).
 */

// ── Event type definitions ────────────────────────────────────────────────

export type AnalyticsEvent =
  | { name: 'widget_open' }
  | { name: 'widget_close' }
  | { name: 'quick_reply_click'; payload: { text: string } }
  | { name: 'message_sent'; payload: { length: number } }
  | { name: 'lead_form_open' }
  | { name: 'lead_form_submit'; payload: { success: boolean } }
  | { name: 'handoff_requested' }
  | { name: 'feedback_up'; payload: { messageId: string } }
  | { name: 'feedback_down'; payload: { messageId: string; reason?: string } }
  | { name: 'locale_switch'; payload: { from: string; to: string } }

// ── Tracking function ─────────────────────────────────────────────────────

/**
 * Track an analytics event.
 *
 * @param event - Typed event object
 *
 * @example
 * ```ts
 * trackEvent({ name: 'widget_open' })
 * trackEvent({ name: 'message_sent', payload: { length: inputText.length } })
 * ```
 */
export function trackEvent(event: AnalyticsEvent): void {
  // ── Console output (development) ─────────────────────────────────────────
  console.log('[Analytics]', event.name, 'payload' in event ? event.payload : '')

  // ── API POST hook (activate in T-043) ────────────────────────────────────
  // apiFetch('/api/analytics/event', {
  //   method: 'POST',
  //   body: event,
  // }).catch(() => { /* fire-and-forget: never throw */ })
}
