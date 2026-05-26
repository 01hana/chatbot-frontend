/**
 * tests/unit/features/admin/useAdminRouteQuery.test.ts
 *
 * Tests for the pure helper functions in useAdminRouteQuery.
 * syncQuery calls useRouter() lazily (requires Nuxt context) — not tested here.
 */

import { describe, it, expect } from 'vitest'
import { useAdminRouteQuery } from '../../../../app/features/admin/composables/useAdminRouteQuery'

// Safe: useAdminRouteQuery() no longer calls useRouter() at construction time
const { getQueryString, getQueryNumber, getQueryBoolean, cleanQueryObject } =
  useAdminRouteQuery()

describe('getQueryString', () => {
  it('returns string value', () => expect(getQueryString({ foo: 'bar' }, 'foo')).toBe('bar'))
  it('returns fallback when key missing', () => expect(getQueryString({}, 'foo')).toBe(''))
  it('returns custom fallback', () => expect(getQueryString({}, 'foo', 'default')).toBe('default'))
  it('picks first element of array value', () =>
    expect(getQueryString({ foo: ['a', 'b'] }, 'foo')).toBe('a'))
  it('returns fallback when value is null', () =>
    expect(getQueryString({ foo: null }, 'foo', 'x')).toBe('x'))
})

describe('getQueryNumber', () => {
  it('parses a valid integer string', () => expect(getQueryNumber({ p: '3' }, 'p')).toBe(3))
  it('returns fallback for missing key', () => expect(getQueryNumber({}, 'p')).toBe(1))
  it('returns fallback for 0', () => expect(getQueryNumber({ p: '0' }, 'p')).toBe(1))
  it('returns fallback for negative', () => expect(getQueryNumber({ p: '-5' }, 'p')).toBe(1))
  it('returns custom fallback', () => expect(getQueryNumber({}, 'p', 10)).toBe(10))
  it('returns fallback for NaN', () => expect(getQueryNumber({ p: 'abc' }, 'p')).toBe(1))
})

describe('getQueryBoolean', () => {
  it('"true" → true', () => expect(getQueryBoolean({ f: 'true' }, 'f')).toBe(true))
  it('"1" → true', () => expect(getQueryBoolean({ f: '1' }, 'f')).toBe(true))
  it('"false" → false', () => expect(getQueryBoolean({ f: 'false' }, 'f')).toBe(false))
  it('missing → default false', () => expect(getQueryBoolean({}, 'f')).toBe(false))
  it('missing → custom fallback', () => expect(getQueryBoolean({}, 'f', true)).toBe(true))
})

describe('cleanQueryObject', () => {
  it('removes null/undefined/empty-string values', () => {
    expect(cleanQueryObject({ a: '', b: null, c: undefined })).toEqual({})
  })

  it('keeps non-empty values as strings', () => {
    expect(cleanQueryObject({ status: 'active', page: 2 })).toEqual({
      status: 'active',
      page: '2',
    })
  })

  it('omits page=1', () => {
    expect(cleanQueryObject({ page: 1 })).toEqual({})
    expect(cleanQueryObject({ page: '1' })).toEqual({})
    expect(cleanQueryObject({ page: 2 })).toEqual({ page: '2' })
  })

  it('omits sortOrder="desc"', () => {
    expect(cleanQueryObject({ sortOrder: 'desc' })).toEqual({})
    expect(cleanQueryObject({ sortOrder: 'asc' })).toEqual({ sortOrder: 'asc' })
  })
})
