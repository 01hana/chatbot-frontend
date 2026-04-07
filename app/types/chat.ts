/**
 * Chat-related ViewModel types (T-005)
 */

// ── Streaming ────────────────────────────────────────────────

/** All possible states of the SSE streaming state machine. */
export type StreamingState =
  | 'idle'
  | 'sending'
  | 'streaming'
  | 'completed'
  | 'error'
  | 'timeout'
  | 'interrupted'
  | 'cancelled'

// ── Messages ────────────────────────────────────────────────

/** Discriminated union of all message types rendered in the chat. */
export type ChatMessageType =
  | 'user'
  | 'ai'
  | 'ai-streaming'
  | 'system-error'
  | 'system-timeout'
  | 'system-intercepted'
  | 'system-low-confidence'
  | 'system-fallback'
  | 'lead-form'
  | 'handoff-status'

/** Metadata attached to AI messages. */
export interface AiMessageMeta {
  /** Confidence score returned by the backend (0–1). */
  confidence?: number
  /** Intent label matched by the backend. */
  intent?: string
  /** Type of content interception (if applicable). */
  interceptType?: 'secret' | 'injection'
}

/**
 * A single message in the chat history.
 * The `type` field acts as a discriminant for the renderer.
 */
export interface ChatMessageVM {
  /** Unique identifier (UUID or server-assigned ID). */
  id: string
  type: ChatMessageType
  content: string
  /** ISO-8601 timestamp. */
  timestamp: string
  /** Only present on AI / system messages. */
  metadata?: AiMessageMeta
}

// ── Widget Config ────────────────────────────────────────────

/** Quick-reply item, one label per supported locale. */
export interface QuickReplyItem {
  'zh-TW': string
  en: string
}

/** Widget configuration fetched from GET /api/widget/config. */
export interface WidgetConfigVM {
  /** Online status of the AI service. */
  status: 'online' | 'busy' | 'offline'
  /** CTA label shown on the launcher button (per locale). */
  ctaText?: Partial<Record<'zh-TW' | 'en', string>>
  /** Welcome message shown at the top of the panel. */
  welcomeMessage?: Partial<Record<'zh-TW' | 'en', string>>
  /** Info bar subtitle. */
  infoBarText?: Partial<Record<'zh-TW' | 'en', string>>
  /** Disclaimer text at the bottom. */
  disclaimer?: Partial<Record<'zh-TW' | 'en', string>>
  /** Service hours string displayed in handoff unavailable state. */
  serviceHours?: Partial<Record<'zh-TW' | 'en', string>>
  /** Quick-reply chips. */
  quickReplies: QuickReplyItem[]
}

// ── Session ──────────────────────────────────────────────────

/** Session status as returned by the backend. */
export type SessionStatus = 'active' | 'expired' | 'closed'

/** Chat session data returned from POST /api/chat/session. */
export interface ChatSessionVM {
  sessionToken: string
  status: SessionStatus
  createdAt: string
  expiresAt?: string
}

// ── Lead Form ────────────────────────────────────────────────

/** Payload submitted to POST /api/chat/lead. */
export interface LeadFormData {
  name: string
  company: string
  /** Phone number — at least phone or email is required. */
  phone?: string
  /** Email — at least phone or email is required. */
  email?: string
  inquiry?: string
  note?: string
}

/** Tracking state for whether the lead form has been submitted this session. */
export interface LeadFormState {
  submitted: boolean
  submittedAt?: string
}

// ── Feedback ────────────────────────────────────────────────

/** Per-message feedback value. */
export type FeedbackValue = null | 'up' | 'down'

/** Feedback state keyed by message ID. */
export type FeedbackState = Map<string, FeedbackValue>

// ── Handoff ─────────────────────────────────────────────────

/** All possible handoff request states. */
export type HandoffStatus = 'normal' | 'requested' | 'waiting' | 'connected' | 'unavailable'

/** Handoff state tracked in the session store. */
export interface HandoffState {
  status: HandoffStatus
  requestedAt?: string
}
