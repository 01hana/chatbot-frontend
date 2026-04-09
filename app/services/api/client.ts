/**
 * API Client (T-004)
 *
 * Wraps $fetch with:
 *  - baseURL from runtimeConfig.public.apiBase
 *  - automatic X-Session-Token header for chat requests
 *  - global 5xx error toast
 *  - 15-second timeout for non-streaming requests
 */

import { $fetch } from 'ofetch';
import type { FetchOptions } from 'ofetch';

/** Shared $fetch instance used by all chat API calls. */
export function createChatClient() {
  const config = useRuntimeConfig();

  return $fetch.create({
    baseURL: config.public.apiBase || 'http://localhost:3000',
    timeout: 15_000,
    onRequest({ options }) {
      // Attach session token when available (store created in T-006).
      // Wrapped in try/catch so this is safe before the store exists.
      try {
        const sessionStore = useChatSessionStore();

        // Safely obtain token from store; support both plain value and ref.
        let token: string | undefined;
        try {
          // sessionStore.sessionToken may be a ref or a plain string|null
          token = (sessionStore as any)?.sessionToken?.value ?? (sessionStore as any)?.sessionToken;
        } catch {
          token = undefined;
        }

        if (token) {
          const headers = new Headers(options.headers as HeadersInit | undefined);
          headers.set('X-Session-Token', String(token));
          options.headers = headers;
        }
      } catch {
        // Store not yet initialised (e.g. SSR / test environment)
      }
    },
    onResponseError({ response }) {
      if (response.status >= 500) {
        try {
          const toast = useToast();
          toast.add({
            title: `伺服器錯誤 (${response.status})`,
            description: '請稍後再試，或聯絡管理員。',
            color: 'error',
          });
        } catch {
          console.error('[API] 5xx error', response.status, response.url);
        }
      }
    },
  });
}

/** Shared $fetch instance for admin (back-office) API calls.
 *  No auth header is attached in this phase. */
export function createAdminClient() {
  const config = useRuntimeConfig();

  return $fetch.create({
    baseURL: config.public.apiBase || 'http://localhost:3000',
    timeout: 15_000,
    onResponseError({ response }) {
      if (response.status >= 500) {
        try {
          const toast = useToast();
          toast.add({
            title: `伺服器錯誤 (${response.status})`,
            description: '請稍後再試，或聯絡管理員。',
            color: 'error',
          });
        } catch {
          console.error('[Admin API] 5xx error', response.status, response.url);
        }
      }
    },
  });
}

/** Convenience wrapper that accepts explicit options — used in composables. */
export async function apiFetch<T>(url: string, options: Record<string, unknown> = {}): Promise<T> {
  const client = createChatClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return client<T>(url, options as any);
}

export async function adminFetch<T>(
  url: string,
  options: Record<string, unknown> = {},
): Promise<T> {
  const client = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return client<T>(url, options as any);
}
