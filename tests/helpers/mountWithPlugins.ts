/**
 * tests/helpers/mountWithPlugins.ts (T-014)
 *
 * A mount helper that wraps @vue/test-utils `mount()` with the plugins
 * required to run chat/admin components in unit tests:
 *  - Pinia (createTestingPinia)
 *  - vue-i18n stub
 *  - Nuxt UI component resolution (optional, for UButton/UInput etc.)
 */

import { mount, type MountingOptions } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import type { Component } from 'vue';

export interface MountOptions extends MountingOptions<Record<string, unknown>> {
  /** Pre-populated Pinia state, keyed by store id. */
  piniaState?: Record<string, Record<string, unknown>>;
}

/**
 * Mount a component with the standard plugin set used across all unit tests.
 *
 * @param component  - The SFC / defineComponent to mount
 * @param options    - Standard vue-test-utils MountingOptions plus `piniaState`
 */
export function mountWithPlugins(component: Component, options: MountOptions = {}) {
  const { piniaState = {}, global = {}, ...rest } = options;

  return mount(component, {
    ...rest,
    global: {
      ...global,
      plugins: [
        createTestingPinia({
          initialState: piniaState,
          stubActions: false,
        }),
        ...(global.plugins ?? []),
      ],
      stubs: {
        // Stub heavy Nuxt-only components that aren't available in jsdom
        NuxtLink: { template: '<a><slot /></a>' },
        NuxtPage: { template: '<div />' },
        ...(global.stubs ?? {}),
      },
    },
  });
}
