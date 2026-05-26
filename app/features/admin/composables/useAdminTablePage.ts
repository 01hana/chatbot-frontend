/**
 * app/features/admin/composables/useAdminTablePage.ts
 *
 * Generic composable for admin list/table pages.
 *
 * Centralises: loading state, error state, pagination, sort, domain filters,
 * URL query sync, filter → param building, and row transformation.
 *
 * Does NOT import any domain-specific service or type.
 * Domain logic (buildParams, fetcher, mapRows) is injected by the caller.
 */

import type { LocationQuery } from 'vue-router';
import type { FilterValues } from '~/features/admin/components/AdminFilterBar.vue';

// ── Public types ────────────────────────────────────────────────────────────

/** Current table state passed to `buildParams`. */
export interface AdminTablePageContext<TFilters extends Record<string, string>> {
  page: number;
  pageSize: number;
  keyword: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  filters: TFilters;
}

export interface AdminTablePageOptions<
  TFilters extends Record<string, string>,
  TParams,
  TRow,
  TDisplay = TRow,
> {
  /** Rows per page. Default: 20. */
  pageSize?: number;
  /** Default sort direction. Default: 'desc'. */
  defaultSortOrder?: 'asc' | 'desc';
  /**
   * Domain-specific filter keys synced to/from the URL query string.
   * Initial values are read from route.query on construction.
   * 'startDate' and 'endDate' are composited into/from the `dateRange`
   * [start, end] tuple used by AdminFilterBar.
   */
  filterQueryKeys: (keyof TFilters & string)[];
  /** Build domain API params from the current table state. */
  buildParams: (ctx: AdminTablePageContext<TFilters>) => TParams;
  /** API function — must return a paginated result shape. */
  fetcher: (params: TParams) => Promise<{ data: TRow[]; meta: { total: number } }>;
  /** Optional: transform raw API rows into display-friendly rows. */
  mapRows?: (raw: TRow[]) => TDisplay[];
  // ── Test hooks ──────────────────────────────────────────────────────────
  /** Override initial query to bypass useRoute() in tests. */
  _initialQuery?: LocationQuery;
  /** Provide a mock router to bypass useRouter() in tests. */
  _router?: { replace: (location: unknown) => void };
}

// ── Composable ──────────────────────────────────────────────────────────────

export function useAdminTablePage<
  TFilters extends Record<string, string>,
  TParams,
  TRow,
  TDisplay = TRow,
>(options: AdminTablePageOptions<TFilters, TParams, TRow, TDisplay>) {
  const {
    pageSize: pageSizeOpt = 20,
    defaultSortOrder = 'desc',
    filterQueryKeys,
    buildParams,
    fetcher,
    mapRows,
  } = options;

  const { getQueryString, getQueryNumber, cleanQueryObject } = useAdminRouteQuery();

  // Resolve initial query — test override or live route.query
  const initialQuery: LocationQuery = options._initialQuery ?? useRoute().query;

  // ── Pagination + sort state ──────────────────────────────────────────────

  const pageSize = pageSizeOpt;
  const initialPage = getQueryNumber(initialQuery, 'page');
  const initialSortOrder = getQueryString(initialQuery, 'sortOrder');

  const page = ref<number>(initialPage > 0 ? initialPage : 1);
  const keyword = ref<string>(getQueryString(initialQuery, 'keyword'));
  const sortBy = ref<string>(getQueryString(initialQuery, 'sortBy'));
  const sortOrder = ref<'asc' | 'desc'>(
    initialSortOrder === 'asc' || initialSortOrder === 'desc' ? initialSortOrder : defaultSortOrder,
  );

  // ── Domain filters (initialised from route query) ────────────────────────

  const filters = reactive<TFilters>(
    Object.fromEntries(
      filterQueryKeys.map(key => [key, getQueryString(initialQuery, key)]),
    ) as TFilters,
  );

  // ── Data state ───────────────────────────────────────────────────────────

  const rows = ref<TRow[]>([]) as Ref<TRow[]>;
  const total = ref(0);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // ── Display rows ─────────────────────────────────────────────────────────

  const displayRows = computed<TDisplay[]>(() =>
    mapRows ? mapRows(rows.value) : (rows.value as unknown as TDisplay[]),
  );

  // ── FilterValues for AdminFilterBar ──────────────────────────────────────

  // Detect once whether this table uses a date range
  const hasDateRange = filterQueryKeys.includes('startDate') || filterQueryKeys.includes('endDate');

  const filterValues = computed<FilterValues>(() => {
    const vals: FilterValues = { keyword: keyword.value };

    for (const key of filterQueryKeys) {
      if (key === 'startDate' || key === 'endDate') continue;

      const value = (filters as Partial<Record<string, string>>)[key];
      vals[key] = value && value.length > 0 ? value : null;
    }

    if (hasDateRange) {
      const startDate = (filters as Partial<Record<string, string>>).startDate ?? '';
      const endDate = (filters as Partial<Record<string, string>>).endDate ?? '';

      vals.dateRange = startDate || endDate ? [startDate, endDate] : null;
    }

    return vals;
  });
  // ── Internal helpers ─────────────────────────────────────────────────────

  function resetPage(): void {
    page.value = 1;
  }

  /** Build the current params object (used for fetch and for export). */
  function buildCurrentParams(): TParams {
    return buildParams({
      page: page.value,
      pageSize,
      keyword: keyword.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
      filters: { ...filters } as TFilters,
    });
  }

  function syncToRoute(): void {
    // Lazy — useRouter() is called only at runtime (not at composable init)
    const router = options._router ?? useRouter();
    const filterEntries = Object.fromEntries(
      filterQueryKeys.map(key => [key, (filters as Record<string, string>)[key]]),
    );
    router.replace({
      query: cleanQueryObject({
        page: page.value,
        keyword: keyword.value,
        sortBy: sortBy.value,
        sortOrder: sortOrder.value,
        ...filterEntries,
      }),
    });
  }

  async function fetchData(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetcher(buildCurrentParams());
      rows.value = res.data;
      total.value = res.meta.total;

      console.log('row', rows.value);
      console.log(displayRows.value);
    } catch (e) {
      error.value = e instanceof Error ? e.message : '載入失敗';
    } finally {
      loading.value = false;
    }
  }

  // ── Public handlers ──────────────────────────────────────────────────────

  async function onFiltersUpdate(vals: FilterValues): Promise<void> {
    keyword.value = (vals.keyword as string) ?? '';

    for (const key of filterQueryKeys) {
      if (key === 'startDate' || key === 'endDate') continue;
      (filters as Record<string, string>)[key] = (vals[key] as string) ?? '';
    }

    if (hasDateRange) {
      const dr = vals.dateRange as [string, string] | null;
      (filters as Record<string, string>).startDate = dr?.[0] ?? '';
      (filters as Record<string, string>).endDate = dr?.[1] ?? '';
    }

    resetPage();
    syncToRoute();
    await fetchData();
  }

  async function onSort(sort: { column: string; direction: 'asc' | 'desc' }): Promise<void> {
    sortBy.value = sort.column;
    sortOrder.value = sort.direction;
    resetPage();
    syncToRoute();
    await fetchData();
  }

  async function onPageChange(p: number): Promise<void> {
    page.value = p;
    syncToRoute();
    await fetchData();
  }

  return {
    // Data
    rows,
    displayRows,
    total,
    loading,
    error,
    // Query state
    page,
    pageSize,
    keyword,
    sortBy,
    sortOrder,
    // Domain filters
    filters,
    filterValues,
    // Actions
    fetchData,
    refresh: fetchData,
    onFiltersUpdate,
    onSort,
    onPageChange,
    resetPage,
    buildCurrentParams,
  };
}
