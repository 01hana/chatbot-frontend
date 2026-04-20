/**
 * utils/analytics.ts (T-012 / T-043)
 *
 * Client-side analytics event tracking.
 * T-043 is DEFERRED — backend endpoint not yet available.
 *
 * This file is retained as a typed placeholder.
 * No frontend code currently calls trackEvent().
 * Restore call-sites once the backend analytics endpoint is ready.
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

// ── Tracking function (placeholder) ──────────────────────────────────────

/**
 * Track an analytics event.
 * Currently a no-op pending backend endpoint availability (T-043 deferred).
 *
 * @param event - Typed event object
 */
export function trackEvent(_event: AnalyticsEvent): void {
  // T-043 deferred: restore API POST once backend endpoint is ready.
  // $fetch('/api/v1/analytics/events', { method: 'POST', body: _event })
  //   .catch(() => { /* fire-and-forget */ })
}
