/**
 * quickReplyMapping (per-message quick-reply injection, Phase 2)
 *
 * Derives contextual quick-reply chips for a finalised AI message.
 *
 * Priority:
 *   1. action  (e.g. 'fallback', 'handoff')
 *   2. intentLabel (e.g. 'product-inquiry', 'general-faq')
 *   3. content keyword fallback
 *
 * Returns [] when no mapping applies (caller should not show chips).
 */

import type { LocaleKey } from '~/types/chat';

// ── Maps ──────────────────────────────────────────────────────────────────────

type IntentKey =
  | 'fallback'
  | 'product-inquiry'
  | 'general-faq'
  | 'product-diagnosis'
  | 'handoff';

const QUICK_REPLY_MAP: Record<IntentKey, Partial<Record<LocaleKey, string[]>>> = {
  fallback: {
    'zh-TW': ['產品規格', '如何報價', '聯絡我們'],
    en: ['Contact us', 'Request a quote', 'Back to main menu'],
  },
  'product-inquiry': {
    'zh-TW': ['精密機械零件', '五金零件', '客製化', '聯繫業務'],
    en: ['Precision parts', 'Hardware parts', 'Custom quote', 'Contact sales'],
  },
  'general-faq': {
    'zh-TW': ['查看產品系列', '下載產品型錄', '聯絡業務'],
    en: ['View product series', 'Download catalogue', 'Contact sales'],
  },
  'product-diagnosis': {
    'zh-TW': ['客製化報價', '留下聯絡資料', '聯繫業務'],
    en: ['Custom quote', 'Leave contact info', 'Contact sales'],
  },
  handoff: {
    'zh-TW': ['留下聯絡資料', '聯絡業務', '回主選單'],
    en: ['Leave contact info', 'Contact sales', 'Back to main menu'],
  },
};

// ── Keyword → intent fallback ─────────────────────────────────────────────────

function _inferIntentFromContent(content: string): IntentKey {
  const text = content.toLowerCase();

  // product-diagnosis / quote keywords
  if (/報價|詢價|客製|樣品|聯繫業務|quote|custom|sample/.test(text)) {
    return 'product-diagnosis';
  }
  // product-inquiry keywords
  if (/線材|螺絲|螺栓|螺帽|華司|規格|材質|零件|wire|screw|bolt|nut|washer|spec/.test(text)) {
    return 'product-inquiry';
  }
  // general-faq keywords
  if (/公司|瑞滬|震南|聯絡|高雄|型錄|目錄|company|catalog|contact/.test(text)) {
    return 'general-faq';
  }
  return 'fallback';
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Derive quick-reply chips for a finalised AI message.
 *
 * @param action       SSE done payload action field (e.g. 'fallback', 'handoff')
 * @param intentLabel  SSE done payload intentLabel field (optional)
 * @param content      Full AI message content (used for keyword fallback)
 * @param locale       Current locale
 */
export function getQuickReplies(
  action: string | null | undefined,
  intentLabel: string | null | undefined,
  content: string,
  locale: LocaleKey,
): string[] {
  // 1. action-based mapping (highest priority)
  if (action === 'fallback' || action === 'handoff') {
    return QUICK_REPLY_MAP[action]?.[locale] ?? QUICK_REPLY_MAP[action]?.['zh-TW'] ?? [];
  }

  // 2. intentLabel-based mapping
  if (intentLabel && intentLabel in QUICK_REPLY_MAP) {
    const key = intentLabel as IntentKey;
    return QUICK_REPLY_MAP[key]?.[locale] ?? QUICK_REPLY_MAP[key]?.['zh-TW'] ?? [];
  }

  // 3. keyword fallback from content
  const inferredIntent = _inferIntentFromContent(content);
  return QUICK_REPLY_MAP[inferredIntent]?.[locale] ?? QUICK_REPLY_MAP[inferredIntent]?.['zh-TW'] ?? [];
}
