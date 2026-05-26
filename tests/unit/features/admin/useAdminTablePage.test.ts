/**
 * tests/unit/features/admin/useAdminTablePage.test.ts
 *
 * Tests for useAdminTablePage composable.
 * Uses _initialQuery to bypass useRoute() and _router to bypass useRouter().
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { LocationQuery } from 'vue-router'
import { useAdminTablePage } from '../../../../app/features/admin/composables/useAdminTablePage'

// ── Test types ──────────────────────────────────────────────────────────────

type TestFilters = { status: string; startDate: string; endDate: string }
type TestParams = {
  page: number
  pageSize: number
  keyword?: string
  status?: string
  startDate?: string
  endDate?: string
}
type TestRow = { id: string; name: string }
type TestDisplay = TestRow & { label: string }

// ── Helpers ─────────────────────────────────────────────────────────────────

function q(params: Record<string, string> = {}): LocationQuery {
  return params as LocationQuery
}

function makeTable(queryOverrides: Record<string, string> = {}) {
  const mockFetcher = vi.fn().mockResolvedValue({
    data: [{ id: '1', name: 'Alice' }],
    meta: { total: 1 },
  })
  const mockReplace = vi.fn()

  const table = useAdminTablePage<TestFilters, TestParams, TestRow>({
    pageSize: 20,
    filterQueryKeys: ['status', 'startDate', 'endDate'],
    buildParams: (ctx) => {
      const p: TestParams = { page: ctx.page, pageSize: ctx.pageSize }
      if (ctx.keyword) p.keyword = ctx.keyword
      if (ctx.filters.status) p.status = ctx.filters.status
      if (ctx.filters.startDate) p.startDate = ctx.filters.startDate
      if (ctx.filters.endDate) p.endDate = ctx.filters.endDate
      return p
    },
    fetcher: mockFetcher,
    _initialQuery: q(queryOverrides),
    _router: { replace: mockReplace },
  })

  return { table, mockFetcher, mockReplace }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('useAdminTablePage — initialisation', () => {
  it('initialises page=1 when query is empty', () => {
    const { table } = makeTable()
    expect(table.page.value).toBe(1)
  })

  it('reads page, keyword, and filters from _initialQuery', () => {
    const { table } = makeTable({ page: '3', keyword: 'hello', status: 'active' })
    expect(table.page.value).toBe(3)
    expect(table.keyword.value).toBe('hello')
    expect(table.filters.status).toBe('active')
  })

  it('reads startDate and endDate from _initialQuery', () => {
    const { table } = makeTable({ startDate: '2024-01-01', endDate: '2024-12-31' })
    expect(table.filters.startDate).toBe('2024-01-01')
    expect(table.filters.endDate).toBe('2024-12-31')
  })

  it('uses provided pageSize', () => {
    const { table } = makeTable()
    expect(table.pageSize).toBe(20)
  })
})

describe('useAdminTablePage — filterValues computed', () => {
  it('exposes keyword in filterValues', () => {
    const { table } = makeTable({ keyword: 'search' })
    expect(table.filterValues.value.keyword).toBe('search')
  })

  it('exposes non-date filters as plain strings', () => {
    const { table } = makeTable({ status: 'closed' })
    expect(table.filterValues.value.status).toBe('closed')
  })

  it('composes dateRange from startDate and endDate', () => {
    const { table } = makeTable({ startDate: '2024-01-01', endDate: '2024-12-31' })
    expect(table.filterValues.value.dateRange).toEqual(['2024-01-01', '2024-12-31'])
  })
})

describe('useAdminTablePage — fetchData', () => {
  it('populates rows and total on success', async () => {
    const { table } = makeTable()
    await table.fetchData()
    expect(table.rows.value).toEqual([{ id: '1', name: 'Alice' }])
    expect(table.total.value).toBe(1)
    expect(table.loading.value).toBe(false)
    expect(table.error.value).toBeNull()
  })

  it('sets error and keeps loading=false on fetch failure', async () => {
    const mockReplace = vi.fn()
    const table = useAdminTablePage<TestFilters, TestParams, TestRow>({
      pageSize: 20,
      filterQueryKeys: ['status', 'startDate', 'endDate'],
      buildParams: (ctx) => ({ page: ctx.page, pageSize: ctx.pageSize }),
      fetcher: vi.fn().mockRejectedValue(new Error('Network error')),
      _initialQuery: q(),
      _router: { replace: mockReplace },
    })

    await table.fetchData()

    expect(table.error.value).toBe('Network error')
    expect(table.rows.value).toEqual([])
    expect(table.loading.value).toBe(false)
  })
})

describe('useAdminTablePage — onFiltersUpdate', () => {
  it('updates keyword, filters, resets page, syncs route, and fetches', async () => {
    const { table, mockFetcher, mockReplace } = makeTable({ page: '3' })
    expect(table.page.value).toBe(3)

    await table.onFiltersUpdate({
      keyword: 'test',
      status: 'closed',
      dateRange: ['2024-01-01', '2024-12-31'],
    })

    expect(table.page.value).toBe(1)
    expect(table.keyword.value).toBe('test')
    expect(table.filters.status).toBe('closed')
    expect(table.filters.startDate).toBe('2024-01-01')
    expect(table.filters.endDate).toBe('2024-12-31')
    expect(mockReplace).toHaveBeenCalled()
    expect(mockFetcher).toHaveBeenCalledOnce()
  })

  it('clears filters when empty values are passed', async () => {
    const { table } = makeTable({ status: 'active' })
    await table.onFiltersUpdate({ keyword: '', status: '' })

    expect(table.keyword.value).toBe('')
    expect(table.filters.status).toBe('')
  })
})

describe('useAdminTablePage — onSort', () => {
  it('updates sort state, resets page, and fetches', async () => {
    const { table, mockFetcher } = makeTable({ page: '2' })

    await table.onSort({ column: 'name', direction: 'asc' })

    expect(table.sortBy.value).toBe('name')
    expect(table.sortOrder.value).toBe('asc')
    expect(table.page.value).toBe(1)
    expect(mockFetcher).toHaveBeenCalledOnce()
  })
})

describe('useAdminTablePage — onPageChange', () => {
  it('updates page, syncs route, and fetches', async () => {
    const { table, mockFetcher, mockReplace } = makeTable()

    await table.onPageChange(5)

    expect(table.page.value).toBe(5)
    expect(mockFetcher).toHaveBeenCalledOnce()
    expect(mockReplace).toHaveBeenCalled()
  })
})

describe('useAdminTablePage — mapRows', () => {
  it('produces transformed displayRows when mapRows is provided', async () => {
    const mockReplace = vi.fn()
    const table = useAdminTablePage<TestFilters, TestParams, TestRow, TestDisplay>({
      pageSize: 20,
      filterQueryKeys: ['status', 'startDate', 'endDate'],
      buildParams: (ctx) => ({ page: ctx.page, pageSize: ctx.pageSize }),
      fetcher: vi.fn().mockResolvedValue({
        data: [{ id: '1', name: 'Alice' }],
        meta: { total: 1 },
      }),
      mapRows: (raw) => raw.map((r) => ({ ...r, label: `label-${r.id}` })),
      _initialQuery: q(),
      _router: { replace: mockReplace },
    })

    await table.fetchData()

    expect(table.displayRows.value).toEqual([{ id: '1', name: 'Alice', label: 'label-1' }])
  })

  it('displayRows equals rows when mapRows is not provided', async () => {
    const { table } = makeTable()
    await table.fetchData()

    expect(table.displayRows.value).toEqual(table.rows.value)
  })
})

describe('useAdminTablePage — buildCurrentParams', () => {
  it('returns params reflecting current state', () => {
    const { table } = makeTable({ page: '2', status: 'active', keyword: 'foo' })

    const params = table.buildCurrentParams()

    expect(params).toMatchObject({ page: 2, status: 'active', keyword: 'foo' })
  })

  it('omits falsy filter values from params', () => {
    const { table } = makeTable({ page: '1' })

    const params = table.buildCurrentParams()

    expect(params.status).toBeUndefined()
    expect(params.keyword).toBeUndefined()
  })
})
