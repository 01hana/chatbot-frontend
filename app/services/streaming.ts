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
  onToken: (token: string) => void;
  /** Called when the stream ends normally (all tokens delivered). */
  onDone: () => void;
  /** Called on any transport or network error. */
  onError: (err: Error) => void;
  /** Called when the server sends `event: timeout` with an optional message. */
  onTimeout?: (message?: string) => void;
  /** Called when the server sends `event: interrupted` with an optional message. */
  onInterrupted?: (message?: string) => void;
}

// ── Internal state ────────────────────────────────────────────────────────────

let _controller: AbortController | null = null;
let _mockTimer: ReturnType<typeof setInterval> | null = null;

// ── Helpers ───────────────────────────────────────────────────────────────────

function isMockEnv(): boolean {
  if (import.meta.env.SSR) return false;

  const mode = String(import.meta.env.NUXT_PUBLIC_CHAT_STREAM_MODE || '')
    .toLowerCase()
    .trim();

  return mode === 'mock';
}

// ── SSE event parsing ────────────────────────────────────────────────────────

/**
 * Parse a complete SSE event block (the lines between two blank lines).
 *
 * Official backend contract:
 *   event: token        data: {"token":"<text>"}
 *   event: done         data: {"message":"<optional>"}  (or no data)
 *   event: error        data: {"message":"<text>"}
 *   event: timeout      data: {"message":"<text>"}
 *   event: interrupted  data: {"message":"<text>"}
 */
function parseSseBlock(
  eventType: string,
  dataLine: string,
):
  | { token: string }
  | { done: true }
  | { error: string }
  | { timeout: string }
  | { interrupted: string }
  | null {
  let payload: Record<string, unknown> = {};
  if (dataLine) {
    try {
      payload = JSON.parse(dataLine) as Record<string, unknown>;
    } catch {
      /* ignore */
    }
  }

  const msg = typeof payload.message === 'string' ? payload.message : '';

  switch (eventType) {
    case 'token':
      return typeof payload.token === 'string' ? { token: payload.token } : null;
    case 'done':
      return { done: true };
    case 'error':
      return { error: msg };
    case 'timeout':
      return { timeout: msg };
    case 'interrupted':
      return { interrupted: msg };
    default:
      // Fallback: handle legacy / non-event-typed streams gracefully
      if (typeof payload.error === 'string') return { error: payload.error };
      if (payload.done === true) return { done: true };
      if (typeof payload.token === 'string') return { token: payload.token };
      return null;
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
];

function startMockStream(callbacks: StreamCallbacks): void {
  let index = 0;
  _mockTimer = setInterval(() => {
    if (_mockTimer === null) return;
    if (index < MOCK_TOKENS.length) {
      callbacks.onToken(MOCK_TOKENS[index]!);
      index++;
    } else {
      clearInterval(_mockTimer!);
      _mockTimer = null;
      callbacks.onDone();
    }
  }, 80);
}

// ── Real SSE streaming ────────────────────────────────────────────────────────

async function startRealStream(
  url: string,
  message: string,
  callbacks: StreamCallbacks,
): Promise<void> {
  _controller = new AbortController();
  const { signal } = _controller;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({ message }),
      signal,
    });

    if (!response.ok) {
      callbacks.onError(new Error(`SSE HTTP ${response.status}`));
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      callbacks.onError(new Error('No readable body in SSE response'));
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let currentEvent = '';

    // SSE arrives as: "event: <type>\ndata: <json>\n\n"
    // We accumulate whole blocks (separated by blank lines) before dispatching.
    const dispatchBlock = (eventType: string, dataLine: string) => {
      const parsed = parseSseBlock(eventType, dataLine);
      if (!parsed) return true; // keep going
      if ('error' in parsed) {
        callbacks.onError(new Error(parsed.error));
        return false;
      }
      if ('done' in parsed) {
        callbacks.onDone();
        return false;
      }
      if ('timeout' in parsed) {
        callbacks.onTimeout?.(parsed.timeout);
        return false;
      }
      if ('interrupted' in parsed) {
        callbacks.onInterrupted?.(parsed.interrupted);
        return false;
      }
      if ('token' in parsed) {
        callbacks.onToken(parsed.token);
      }
      return true; // keep going
    };

    let keepGoing = true;
    while (keepGoing) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      let dataLine = '';
      for (const raw of lines) {
        const line = raw.trimEnd();

        if (line.startsWith('event:')) {
          currentEvent = line.slice('event:'.length).trim();
          dataLine = '';
        } else if (line.startsWith('data:')) {
          dataLine = line.slice('data:'.length).trim();
        } else if (line === '') {
          // Blank line = end of event block; dispatch if we have anything
          if (dataLine || currentEvent) {
            keepGoing = dispatchBlock(currentEvent || 'token', dataLine);
          }
          currentEvent = '';
          dataLine = '';
          if (!keepGoing) break;
        }
      }
    }

    callbacks.onDone();
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') return;
    callbacks.onError(err instanceof Error ? err : new Error(String(err)));
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
export function startStream(streamUrl: string, message: string, callbacks: StreamCallbacks): void {
  cancelStream(); // always cancel any prior stream
  if (isMockEnv()) {
    console.log('isMockEnv true');
    startMockStream(callbacks);
  } else {
    startRealStream(streamUrl, message, callbacks);
  }
}

/**
 * Cancel the currently active stream.
 * Safe to call when no stream is running.
 */
export function cancelStream(): void {
  if (_mockTimer !== null) {
    clearInterval(_mockTimer);
    _mockTimer = null;
  }
  if (_controller) {
    _controller.abort();
    _controller = null;
  }
}
