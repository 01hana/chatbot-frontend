/**
 * tests/unit/smoke.test.ts (T-014)
 *
 * Minimal smoke test to verify the Vitest + @nuxt/test-utils setup is working.
 */

import { describe, it, expect } from 'vitest'

describe('smoke test', () => {
  it('vitest is configured correctly', () => {
    expect(1 + 1).toBe(2)
  })
})
