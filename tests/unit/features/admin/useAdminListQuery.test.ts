/**
 * tests/unit/features/admin/useAdminListQuery.test.ts
 *
 * Tests for useAdminListQuery composable.
 * Uses the _initialQuery option to bypass useRoute() (Nuxt runtime not available).
 * syncToRoute() calls useRouter() lazily — not tested here.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useAdminListQuery } from '../../../../app/features/admin/composables/useAdminListQuery'

function makeQuery(params: Record<string, string> = {}) {
  return { _initialQuery: params }
}

describe('useAdminListQuery — default initialisation', () => {
  it('initialises page=1 when query is empty', () => {
    const q = useAdminListQuery(makeQuery())
    expect(q.page.value).toBe(1)
  })

  it('initialises sortOrder to "desc" by default', () => {
    const q = useAdminListQuery(makeQuery())
    expect(q.sortOrder.value).toBe('desc')
  })

  it('uses provided pageSize', () => {
    const q = useAdminListQuery({ ...makeQuery(), pageSize: 50 })
    expect(q.pageSize).toBe(50)
  })

  it('keyword defaults to empty string', () => {
    const q = useAdminListQuery(makeQuery())
    expect(q.keyword.value).toBe('')
  })
})

describe('useAdminListQuery — URL initialisation', () => {
  it('reads page from query string', () => {
    const q = useAdminListQuery(makeQuery({ page: '3' }))
    expect(q.page.value).toBe(3)
  })

  it('reads keyword from query string', () => {
    const q = useAdminListQuery(makeQuery({ keyword: 'hello' }))
    expect(q.keyword.value).toBe('hello')
  })

  it('reads sortBy and sortOrder from query string', () => {
    const q = useAdminListQuery(makeQuery({ sortBy: 'startTime', sortOrder: 'asc' }))
    expect(q.sortBy.value).toBe('startTime')
    expect(q.sortOrder.value).toBe('asc')
  })

  it('clamps page < 1 to 1', () => {
    const q = useAdminListQuery(makeQuery({ page: '0' }))
    expect(q.page.value).toBe(1)
  })
})

describe('useAdminListQuery — helpers', () => {
  it('resetPage sets page to 1', () => {
    const q = useAdminListQuery(makeQuery())
    q.page.value = 5
    q.resetPage()
    expect(q.page.value).toBe(1)
  })

  it('onPageChange updates page', () => {
    const q = useAdminListQuery(makeQuery())
    q.onPageChange(4)
    expect(q.page.value).toBe(4)
  })

  it('onSort updates sortBy / sortOrder and resets page', () => {
    const q = useAdminListQuery(makeQuery())
    q.page.value = 3
    q.onSort({ column: 'startTime', direction: 'asc' })
    expect(q.sortBy.value).toBe('startTime')
    expect(q.sortOrder.value).toBe('asc')
    expect(q.page.value).toBe(1)
  })

  it('keyword is reactive and writable', () => {
    const q = useAdminListQuery(makeQuery())
    q.keyword.value = 'updated'
    expect(q.keyword.value).toBe('updated')
  })
})
