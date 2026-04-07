/**
 * vitest.config.ts (T-014)
 *
 * Vitest configuration for unit tests.
 * Uses @nuxt/test-utils/config to handle Nuxt auto-imports and module mocking.
 */
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['app/**/*.{ts,vue}'],
      exclude: ['app/**/*.d.ts'],
    },
  },
})
