/**
 * Chat API Service (T-022 / T-035)
 *
 * Encapsulates all REST calls for the chat domain.
 * Paths follow the official contract: chat/sessions/:sessionToken/...
 *
 *   createSession       POST  chat/sessions
 *   getSessionHistory   GET   chat/sessions/:sessionToken/history
 *   getStreamUrl        helper – returns the SSE endpoint URL
 *   submitLead          POST  chat/sessions/:sessionToken/lead
 *   requestHandoff      POST  chat/sessions/:sessionToken/handoff
 *   submitFeedback      POST  chat/sessions/:sessionToken/messages/:messageId/feedback
 *
 * Note: Stream cancellation is handled via AbortController in services/streaming.ts,
 * not via a DELETE endpoint.
 */

import { createChatClient } from '~/services/api/client';
import type {
  ChatSessionVM,
  SessionHistoryResponse,
  ChatMessageVM,
  LeadFormData,
  HandoffResponse,
} from '~/types/chat';
import type { ApiResponse } from '~/types/api';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Resolve the API base URL at call-time (client-side only, ssr: false). */
function apiBase(): string {
  const config = useRuntimeConfig();

  return (config.public.apiBase as string) || 'http://localhost:3001';
}

// ── Phase 1 API ───────────────────────────────────────────────────────────────

/**
 * Create a new chat session.
 * POST /chat/sessions → ChatSessionVM
 */
export async function createSession(): Promise<ChatSessionVM> {
  const client = createChatClient();
  const res = await client<ApiResponse<ChatSessionVM>>('chat/sessions', {
    method: 'POST',
  });

  return res.data;
}

/**
 * Retrieve the message history for an existing session.
 * GET chat/sessions/:sessionToken/history → ChatMessageVM[]
 */
export async function getSessionHistory(sessionToken: string): Promise<SessionHistoryResponse> {
  const client = createChatClient();
  const res = await client<ApiResponse<SessionHistoryResponse>>(
    `chat/sessions/${sessionToken}/history`,
    { method: 'GET' },
  );
  return res.data;
}

/**
 * Return the SSE streaming endpoint URL for a given session.
 * The actual SSE connection is opened by `services/streaming.ts`.
 *
 * T-034B: the backend expects POST /chat/sessions/:sessionToken/messages
 * with the user message in the JSON body, not as a query-string parameter.
 */
export function getStreamUrl(sessionToken: string): string {
  const base = apiBase();
  return `${base}chat/sessions/${sessionToken}/messages`;
}

/**
 * @deprecated Stream cancellation uses AbortController, not a DELETE endpoint.
 * Kept for backward compatibility during Phase 1 → Phase 2 migration.
 */
export async function cancelStream(sessionToken: string): Promise<void> {
  const client = createChatClient();
  await client(`chat/sessions/${sessionToken}/stream`, {
    method: 'DELETE',
  });
}

// ── Phase 2 API (T-035) ───────────────────────────────────────────────────────

/**
 * Submit a lead form for the current session.
 * POST /chat/sessions/:sessionToken/lead
 *
 * NOTE: Backend Phase 2 API not yet available.
 *       This method provides the correct typed interface for when it is ready.
 */
export async function submitLead(
  sessionToken: string,
  data: LeadFormData,
): Promise<ApiResponse<{ leadId: string }>> {
  const client = createChatClient();
  return client<ApiResponse<{ leadId: string }>>(`chat/sessions/${sessionToken}/lead`, {
    method: 'POST',
    body: data,
  });
}

/**
 * Request a handoff to a human agent for the current session.
 * POST chat/sessions/:sessionToken/handoff
 *
 * NOTE: Backend Phase 2 API not yet available.
 *       This method provides the correct typed interface for when it is ready.
 */
export async function requestHandoff(sessionToken: string): Promise<HandoffResponse> {
  const client = createChatClient();
  const res = await client<ApiResponse<HandoffResponse>>(`chat/sessions/${sessionToken}/handoff`, {
    method: 'POST',
  });
  return res.data;
}

/**
 * Submit feedback (thumbs up/down) for a specific AI message.
 * POST chat/sessions/:sessionToken/messages/:messageId/feedback
 *
 * NOTE: Backend Phase 2 API not yet available.
 *       This method provides the correct typed interface for when it is ready.
 */
export async function submitFeedback(
  sessionToken: string,
  messageId: string,
  value: 'up' | 'down',
  reason?: string,
): Promise<void> {
  const client = createChatClient();
  await client(`chat/sessions/${sessionToken}/messages/${messageId}/feedback`, {
    method: 'POST',
    body: { value, ...(reason ? { reason } : {}) },
  });
}
