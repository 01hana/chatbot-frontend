/**
 * tests/unit/features/chat/useStreaming.test.ts (T-030)
 *
 * Unit tests for useStreaming composable (T-024).
 *
 * Strategy:
 *  - vi.mock() the two external dependencies:
 *      ~/services/streaming   (startStream / cancelStream)
 *      ~/services/api/chat    (getStreamUrl / cancelStream)
 *  - Use createTestingPinia to spin up a real useChatSessionStore in isolation
 *  - Use vi.useFakeTimers() to control the 30-second timeout
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// ── Mock external services ────────────────────────────────────────────────────

// Captured callbacks so each test can fire them directly
let _capturedCallbacks: {
  onToken: (t: string) => void
  onDone: () => void
  onError: (e: Error) => void
  onTimeout?: (message?: string) => void
  onInterrupted?: (message?: string) => void
} | null = null

const mockStartStream = vi.fn((_url: string, _msg: string, cbs: typeof _capturedCallbacks) => {
  _capturedCallbacks = cbs
})
const mockServiceCancel = vi.fn()
const mockGetStreamUrl = vi.fn(() => 'http://localhost/stream')
const mockApiCancel = vi.fn(() => Promise.resolve())

vi.mock('~/services/streaming', () => ({
  startStream: (...args: Parameters<typeof mockStartStream>) => mockStartStream(...args),
  cancelStream: () => mockServiceCancel(),
}))

vi.mock('~/services/api/chat', () => ({
  getStreamUrl: (...args: Parameters<typeof mockGetStreamUrl>) => mockGetStreamUrl(...args),
  cancelStream: (...args: Parameters<typeof mockApiCancel>) => mockApiCancel(...args),
  // other exports used elsewhere — provide stubs so imports don't crash
  createSession: vi.fn(),
  getSessionHistory: vi.fn(),
}))

// ── Store auto-imports shim ───────────────────────────────────────────────────
// In the Nuxt test environment these are auto-imported; we import manually here.
import { useChatSessionStore } from '../../../../app/features/chat/stores/useChatSessionStore'
import { useStreaming } from '../../../../app/features/chat/composables/useStreaming'

// ── Helpers ───────────────────────────────────────────────────────────────────

function setupPinia() {
  const pinia = createPinia()
  setActivePinia(pinia)

  const sessionStore = useChatSessionStore()
  // Seed a valid session token so startStreaming doesn't bail out early
  sessionStore.setSessionToken('test-token-abc')
  // Append a placeholder streaming message that useStreaming appends tokens to
  sessionStore.appendMessage({
    id: 'streaming-1',
    type: 'ai-streaming',
    content: '',
    timestamp: new Date().toISOString(),
  })

  return sessionStore
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useStreaming', () => {
  let sessionStore: ReturnType<typeof useChatSessionStore>

  beforeEach(() => {
    vi.useFakeTimers()
    _capturedCallbacks = null
    mockStartStream.mockClear()
    mockServiceCancel.mockClear()
    mockGetStreamUrl.mockClear()
    mockApiCancel.mockClear()
    sessionStore = setupPinia()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ── State transitions ────────────────────────────────────────────────────

  it('idle → sending → streaming → completed 狀態轉換', async () => {
    expect(sessionStore.streamingState).toBe('idle')

    const { startStreaming } = useStreaming()
    const streamPromise = startStreaming('hello')

    // After startStreaming is called, should be 'sending'
    expect(sessionStore.streamingState).toBe('sending')

    // Simulate first token → transitions to 'streaming'
    _capturedCallbacks!.onToken('你')
    expect(sessionStore.streamingState).toBe('streaming')

    // More tokens
    _capturedCallbacks!.onToken('好')
    _capturedCallbacks!.onToken('！')

    // Stream ends
    _capturedCallbacks!.onDone()
    await streamPromise
    expect(sessionStore.streamingState).toBe('completed')
  })

  it('token append 邏輯正確：多個 token 依序 append 至最後一則 ai-streaming 訊息', async () => {
    const { startStreaming } = useStreaming()
    startStreaming('hi')

    _capturedCallbacks!.onToken('A')
    _capturedCallbacks!.onToken('B')
    _capturedCallbacks!.onToken('C')

    const last = sessionStore.messages.at(-1)!
    expect(last.type).toBe('ai-streaming')
    expect(last.content).toBe('ABC')
  })

  it('串流完成後 ai-streaming 訊息轉型為 ai', async () => {
    const { startStreaming } = useStreaming()
    startStreaming('hi')

    _capturedCallbacks!.onToken('OK')
    _capturedCallbacks!.onDone()

    const last = sessionStore.messages.at(-1)!
    expect(last.type).toBe('ai')
    expect(last.content).toBe('OK')
  })

  // ── 30-second timeout ────────────────────────────────────────────────────

  it('30 秒 timeout：sending 狀態下無 token 則轉為 timeout', async () => {
    const { startStreaming } = useStreaming()
    startStreaming('ping')

    expect(sessionStore.streamingState).toBe('sending')

    // Advance fake timer by exactly 30 s
    vi.advanceTimersByTime(30_000)

    expect(sessionStore.streamingState).toBe('timeout')
    expect(mockServiceCancel).toHaveBeenCalled()
  })

  it('收到第一個 token 後 timeout timer 取消，不會在 30 s 後觸發 timeout', async () => {
    const { startStreaming } = useStreaming()
    startStreaming('ping')

    // Receive first token at 5 s
    vi.advanceTimersByTime(5_000)
    _capturedCallbacks!.onToken('hi')
    expect(sessionStore.streamingState).toBe('streaming')

    // Advance another 30 s — timeout should NOT fire
    vi.advanceTimersByTime(30_000)
    expect(sessionStore.streamingState).toBe('streaming')
  })

  // ── Cancel ───────────────────────────────────────────────────────────────

  it('cancelStreaming() → state 為 cancelled，serviceCancel 被呼叫', async () => {
    const { startStreaming, cancelStreaming } = useStreaming()
    startStreaming('hello')

    expect(sessionStore.streamingState).toBe('sending')

    await cancelStreaming()

    expect(sessionStore.streamingState).toBe('cancelled')
    expect(mockServiceCancel).toHaveBeenCalled()
  })

  // ── Error ────────────────────────────────────────────────────────────────

  it('onError callback → state 為 interrupted（非 cancelled 時）', async () => {
    const { startStreaming } = useStreaming()
    startStreaming('hello')

    _capturedCallbacks!.onToken('partial')
    _capturedCallbacks!.onError(new Error('network dropped'))

    expect(sessionStore.streamingState).toBe('interrupted')
  })

  it('onError after cancelStreaming → state 保持 cancelled（不覆蓋）', async () => {
    const { startStreaming, cancelStreaming } = useStreaming()
    startStreaming('hello')

    await cancelStreaming()
    expect(sessionStore.streamingState).toBe('cancelled')

    // Stream service still fires onError after cancel – should be ignored
    _capturedCallbacks!.onError(new Error('aborted'))
    expect(sessionStore.streamingState).toBe('cancelled')
  })

  // ── SSE contract: event-typed timeout / interrupted ───────────────────────

  it('onTimeout callback（event: timeout）→ state 為 timeout', () => {
    const { startStreaming } = useStreaming()
    startStreaming('ping')

    // Server sends: event: timeout / data: {"message":"request timed out"}
    _capturedCallbacks!.onTimeout?.('request timed out')

    expect(sessionStore.streamingState).toBe('timeout')
  })

  it('onInterrupted callback（event: interrupted）→ state 為 interrupted', () => {
    const { startStreaming } = useStreaming()
    startStreaming('ping')

    _capturedCallbacks!.onToken('partial')
    // Server sends: event: interrupted / data: {"message":"stream cut off"}
    _capturedCallbacks!.onInterrupted?.('stream cut off')

    expect(sessionStore.streamingState).toBe('interrupted')
  })

  // ── No session token ─────────────────────────────────────────────────────

  it('session token 為 null 時，startStreaming → state 為 error，不呼叫 startStream', async () => {
    sessionStore.setSessionToken(null)

    const { startStreaming } = useStreaming()
    await startStreaming('hello')

    expect(sessionStore.streamingState).toBe('error')
    expect(mockStartStream).not.toHaveBeenCalled()
  })
})
