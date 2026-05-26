/**
 * app/features/admin/composables/useAdminRouteQuery.ts
 *
 * Utility composable for reading and writing URL query parameters in admin pages.
 * Provides typed helpers for string / number / boolean extraction and
 * a `syncQuery` helper that strips default / empty values before pushing.
 */

import type { LocationQuery } from 'vue-router'

export function useAdminRouteQuery() {
  /** Read a query param as a trimmed string (default: ''). */
  function getQueryString(query: LocationQuery, key: string, fallback = ''): string {
    const v = query[key]
    if (v === undefined || v === null) return fallback
    return String(Array.isArray(v) ? v[0] ?? fallback : v)
  }

  /** Read a query param as an integer >= 1 (default: 1). */
  function getQueryNumber(query: LocationQuery, key: string, fallback = 1): number {
    const v = Number(query[key])
    return isNaN(v) || v < 1 ? fallback : v
  }

  /** Read a query param as a boolean ('true'/'1' → true, anything else → false). */
  function getQueryBoolean(query: LocationQuery, key: string, fallback = false): boolean {
    const v = query[key]
    if (v === undefined || v === null) return fallback
    return v === 'true' || v === '1'
  }

  /**
   * Strip nullish / empty-string values from a plain query object.
   * Also omits `page` when it equals 1 and `sortOrder` when it equals 'desc'
   * (these are the universal defaults and shouldn't clutter the URL).
   */
  function cleanQueryObject(
    obj: Record<string, string | number | boolean | null | undefined>,
  ): Record<string, string> {
    const result: Record<string, string> = {}
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined || value === null || value === '') continue
      if (key === 'page' && (value === 1 || value === '1')) continue
      if (key === 'sortOrder' && value === 'desc') continue
      result[key] = String(value)
    }
    return result
  }

  /**
   * Push a cleaned query object to the current route (replace history entry).
   * `useRouter()` is called lazily at invocation time so this composable can be
   * imported safely outside a component setup context (e.g. in tests).
   */
  function syncQuery(
    queryObject: Record<string, string | number | boolean | null | undefined>,
  ): void {
    const router = useRouter()
    router.replace({ query: cleanQueryObject(queryObject) })
  }

  return {
    getQueryString,
    getQueryNumber,
    getQueryBoolean,
    cleanQueryObject,
    syncQuery,
  }
}
