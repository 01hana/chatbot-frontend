/**
 * Admin API client (T-051)
 *
 * A plain $fetch instance scoped to the admin API base URL.
 * No session token or Authorization header is attached — admin
 * auth is deferred to a later phase.
 */

import { $fetch } from 'ofetch'

/** Resolve admin API base URL at call-time (client-side only). */
export function adminApiBase(): string {
  const config = useRuntimeConfig()
  return (config.public.apiBase as string) || 'http://localhost:3001'
}

/** Shared $fetch instance for admin REST calls. */
export function createAdminClient() {
  return $fetch.create({
    baseURL: adminApiBase(),
    timeout: 15_000,
  })
}
