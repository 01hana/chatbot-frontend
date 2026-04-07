/**
 * Mock API client helper for Vitest unit tests (T-004)
 *
 * Usage:
 *   import { mockApiFetch, setMockResponse } from '~/tests/fixtures/mockClient'
 *
 *   setMockResponse('/api/chat/session', { sessionToken: 'test-token-123' })
 *   const result = await mockApiFetch('/api/chat/session', { method: 'POST' })
 */

const _mockStore = new Map<string, unknown>()

/** Register a mock response for a given URL pattern. */
export function setMockResponse(url: string, response: unknown): void {
  _mockStore.set(url, response)
}

/** Clear all registered mock responses. */
export function clearMockResponses(): void {
  _mockStore.clear()
}

/** Drop-in replacement for apiFetch / adminFetch in tests. */
export async function mockApiFetch<T>(url: string): Promise<T> {
  if (_mockStore.has(url)) {
    return _mockStore.get(url) as T
  }
  throw new Error(`[mockApiFetch] No mock registered for: ${url}`)
}
