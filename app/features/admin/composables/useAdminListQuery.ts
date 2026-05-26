/**
 * app/features/admin/composables/useAdminListQuery.ts
 *
 * Shared reactive state for admin list pages (conversations / leads / tickets).
 *
 * Manages: page, pageSize, keyword, sortBy, sortOrder
 * Reads initial values from the current route query.
 * Provides syncToRoute() to push state → URL (domain-specific filters can be
 * merged in via the `extraQuery` argument).
 *
 * Does NOT call any API – pages are responsible for fetching.
 */

import type { LocationQuery } from 'vue-router'

export interface AdminListQueryOptions {
  /** Rows per page. Default: 20. */
  pageSize?: number
  /** Default sort direction when none is specified in the URL. Default: 'desc'. */
  defaultSortOrder?: 'asc' | 'desc'
  /**
   * Override the initial URL query (useful for unit testing without a Nuxt context).
   * At runtime this is omitted and `useRoute().query` is used instead.
   */
  _initialQuery?: LocationQuery
}

export function useAdminListQuery(options?: AdminListQueryOptions) {
  const { getQueryString, getQueryNumber, cleanQueryObject } = useAdminRouteQuery()

  const pageSize = options?.pageSize ?? 20
  const defaultSortOrder = options?.defaultSortOrder ?? 'desc'

  // Resolve the initial query: test override > live route query
  const initialQuery: LocationQuery = options?._initialQuery ?? useRoute().query

  // ── Reactive state initialised from URL query ──────────────────────────

  const page = ref<number>(getQueryNumber(initialQuery, 'page'))
  const keyword = ref<string>(getQueryString(initialQuery, 'keyword'))
  const sortBy = ref<string>(getQueryString(initialQuery, 'sortBy'))
  const sortOrder = ref<'asc' | 'desc'>(
    (getQueryString(initialQuery, 'sortOrder') as 'asc' | 'desc') || defaultSortOrder,
  )

  // ── Helpers ────────────────────────────────────────────────────────────

  function resetPage(): void {
    page.value = 1
  }

  /**
   * Push the current list-query state to the browser URL.
   * Pass `extraQuery` for domain-specific filters (e.g. status, startDate).
   * `useRouter()` is called lazily so this composable is safe in test context
   * when only state management is exercised (not URL sync).
   */
  function syncToRoute(
    extraQuery?: Record<string, string | number | boolean | null | undefined>,
  ): void {
    const router = useRouter()
    router.replace({
      query: cleanQueryObject({
        page: page.value,
        keyword: keyword.value,
        sortBy: sortBy.value,
        sortOrder: sortOrder.value,
        ...extraQuery,
      }),
    })
  }

  /** Handle a sort-column-click event emitted by AdminDataTable. */
  function onSort(sort: { column: string; direction: 'asc' | 'desc' }): void {
    sortBy.value = sort.column
    sortOrder.value = sort.direction
    resetPage()
  }

  /** Handle a page-change event emitted by AdminDataTable. */
  function onPageChange(p: number): void {
    page.value = p
  }

  return {
    page,
    pageSize,
    keyword,
    sortBy,
    sortOrder,
    resetPage,
    syncToRoute,
    onSort,
    onPageChange,
  }
}
