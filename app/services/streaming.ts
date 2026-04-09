/**
 * Streaming Service (T-023)
 *
 * Provides a transport-agnostic interface for receiving server-sent token
 * streams.  The current implementation uses `fetch` + `ReadableStream` to
 * consume an SSE endpoint.
 *
 * Interface contract (must NOT change even if backend moves to WebSocket):
 *   startStream(streamUrl, message, callbacks)
 *   cancelStream()
 *
 * Backend SSE event format expected:
 *   data: {"token":"<text>"}          ← normal token
 *   data: {"done":true}               ← stream completed
 *   data: {"error":"<message>"}       ← backend error
 *
 * Development mock:
 *   When NUXT_PUBLIC_API_BASE is empty or points to localhost the service
 *   falls back to a ReadableStream simulation that pushes one token every 80ms.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StreamCallbacks {
  /** Called for every decoded token. */
  onToken: (token: string) => void
  /** Called when the stream ends normally (all tokens delivered). */
  onDone: () => void
  /** Called on any transport or parse error. */
  onError: (err: Error) => void
}

// ── Internal state ────────────────────────────────────────────────────────────

let _controller: AbortController | null = null
let _mockTimer: ReturnType<typeof setInterval> | null = null

// ── Helpers ───────────────────────────────────────────────────────────────────

function isMockEnv(): boolean {
  if (import.meta.env.SSR) return false
  try {
    const base = useRuntimeConfig().public.apiBase as string
    return !base || base.includes('localhost') || base.includes('127.0.0.1')
  } catch {
    return true
  }
}

function parseSseLine(
  line: string,
): { token: string } | { done: true } | { error: string } | null {
  const trimmed = line.trim()
  if (!trimmed.startsWith('data:')) return null
  const json = trimmed.slice('data:'.length).trim()
  if (!json || json === '[DONE]') return { done: true }
  try {
    const parsed = JSON.parse(json) as { token?: string; done?: boolean; error?: string }
    if (parsed.error) return { error: parsed.error }
    if (parsed.done) return { done: true }
    if (parsed.token) return { token: parsed.token }
    return null
  } catch {
    return null
  }
}

// ── Mock streaming ────────────────────────────────────────────────────────────

const MOCK_TOKENS = [
  '您好！',
  '根據您的問題，',
  '以下是相關資訊：\n\n',
  '1. **選擇商品** — 瀏覽型錄選擇合適型號\n',
  '2. **加入購物車** — 確認規格與數量\n',
  '3. **結帳付款** — 支援信用卡 / 匯款\n\n',
  '如有其他疑問，歡迎繼續詢問。',
]

function startMockStream(callbacks: StreamCallbacks): void {
  let index = 0
  _mockTimer = setInterval(() => {
    if (_mockTimer === null) return
    if (index < MOCK_TOKENS.length) {
      callbacks.onToken(MOCK_TOKENS[index]!)
      index++
    } else {
      clearInterval(_mockTimer!)
      _mockTimer = null
      callbacks.onDone()
    }
  }, 80)
}

// ── Real SSE streaming ────────────────────────────────────────────────────────

async function startRealStream(url: string, callbacks: StreamCallbacks): Promise<void> {
  _controller = new AbortController()
  const { signal } = _controller

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'text/event-stream', 'Cache-Control': 'no-cache' },
      signal,
    })

    if (!response.ok) {
      callbacks.onError(new Error(`SSE HTTP ${response.status}`))
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      callbacks.onError(new Error('No readable body in SSE response'))
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const parsed = parseSseLine(line)
        if (!parsed) continue
        if ('error' in parsed) { callbacks.onError(new Error(parsed.error)); return }
        if ('done' in parsed && parsed.done) { callbacks.onDone(); return }
        if ('token' in parsed && parsed.token) callbacks.onToken(parsed.token)
      }
    }

    callbacks.onDone()
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') return
    callbacks.onError(err instanceof Error ? err : new Error(String(err)))
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Open an SSE stream.
 *
 * @param streamUrl  Full URL to the SSE endpoint (built by getStreamUrl())
 * @param _message   User message text (forwarded for future middleware use)
 * @param callbacks  Token / done / error handlers
 */
export function startStream(
  streamUrl: string,
  _message: string,
  callbacks: StreamCallbacks,
): void {
  cancelStream() // always cancel any prior stream
  if (isMockEnv()) {
    startMockStream(callbacks)
  } else {
    startRealStream(streamUrl, callbacks)
  }
}

/**
 * Cancel the currently active stream.
 * Safe to call when no stream is running.
 */
export function cancelStream(): void {
  if (_mockTimer !== null) {
    clearInterval(_mockTimer)
    _mockTimer = null
  }
  if (_controller) {
    _controller.abort()
    _controller = null
  }
}
