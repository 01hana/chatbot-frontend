/**
 * utils/errorReporter.ts (T-012)
 *
 * Centralised error reporting entry-point.
 * Currently logs to console; the Sentry integration hook is pre-wired
 * for Phase 3 / production hardening.
 */

export interface ErrorContext {
  /** Vue component name or feature area where the error occurred */
  component?: string
  /** Additional arbitrary metadata */
  [key: string]: unknown
}

/**
 * Report an error with optional context.
 *
 * @param err     - The caught error (or any value thrown)
 * @param context - Optional metadata to aid debugging
 *
 * @example
 * ```ts
 * try {
 *   await apiFetch('/api/chat/session', { method: 'POST' })
 * } catch (err) {
 *   reportError(err, { component: 'useChatSession', action: 'initSession' })
 * }
 * ```
 */
export function reportError(err: unknown, context?: ErrorContext): void {
  // ── Console output (always) ──────────────────────────────────────────────
  console.error('[ErrorReporter]', err, context ?? '')

  // ── Sentry hook (pre-wired, activate in Phase 3) ─────────────────────────
  // if (window.__SENTRY__) {
  //   Sentry.withScope((scope) => {
  //     if (context) scope.setExtras(context)
  //     Sentry.captureException(err)
  //   })
  // }
}
