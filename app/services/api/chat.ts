/**
 * Chat API Service (T-022)
 *
 * Encapsulates all REST calls for the chat domain:
 *   createSession      POST   /api/chat/session
 *   getSessionHistory  GET    /api/chat/session/:token/history
 *   getStreamUrl       helper – returns the SSE endpoint URL for a session+message
 *   cancelStream       DELETE /api/chat/session/:token/stream
 *
 * All functions use the shared chat client from services/api/client.ts so the
 * X-Session-Token header and 5xx toast are applied automatically.
 */

import { createChatClient } from '~/services/api/client'
import type { ChatSessionVM, ChatMessageVM } from '~/types/chat'
import type { ApiResponse } from '~/types/api'

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Resolve the API base URL at call-time (client-side only, ssr: false). */
function apiBase(): string {
  const config = useRuntimeConfig()
  return (config.public.apiBase as string) || 'http://localhost:3000'
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Create a new chat session.
 * POST /api/chat/session → ChatSessionVM
 */
export async function createSession(): Promise<ChatSessionVM> {
  const client = createChatClient()
  const res = await client<ApiResponse<ChatSessionVM>>('/api/chat/session', {
    method: 'POST',
  })
  return res.data
}

/**
 * Retrieve the message history for an existing session.
 * GET /api/chat/session/:token/history → ChatMessageVM[]
 */
export async function getSessionHistory(sessionToken: string): Promise<ChatMessageVM[]> {
  const client = createChatClient()
  const res = await client<ApiResponse<ChatMessageVM[]>>(
    `/api/chat/session/${sessionToken}/history`,
    { method: 'GET' },
  )
  return res.data
}

/**
 * Return the SSE streaming endpoint URL for a given session + message.
 *
 * The actual SSE connection is opened by `services/streaming.ts`; this
 * function only constructs and returns the URL so the caller stays clean.
 *
 * Query params:
 *   message – the user's text (URL-encoded)
 */
export function getStreamUrl(sessionToken: string, message: string): string {
  const base = apiBase()
  const encoded = encodeURIComponent(message)
  return `${base}/api/chat/session/${sessionToken}/stream?message=${encoded}`
}

/**
 * Cancel an in-progress streaming response.
 * DELETE /api/chat/session/:token/stream
 */
export async function cancelStream(sessionToken: string): Promise<void> {
  const client = createChatClient()
  await client(`/api/chat/session/${sessionToken}/stream`, {
    method: 'DELETE',
  })
}
