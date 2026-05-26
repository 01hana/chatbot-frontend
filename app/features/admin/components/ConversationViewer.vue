<script setup lang="ts">
/**
 * ConversationViewer (T-054)
 *
 * Read-only chat bubble renderer for admin conversation detail.
 * - user messages: right-aligned
 * - ai / system messages: left-aligned
 * - No feedback buttons
 * - Markdown rendered in AI messages
 * - AuditEventBadge shown for intercepted / guard events
 */

import { renderMarkdown } from '~/utils/markdown'
import type { ChatMessageVM, ChatMessageType, ChatMessageRole } from '~/types/chat'

const { formatTimeShort } = useFormat()

const props = defineProps<{
  messages: ChatMessageVM[]
}>()

// ── Helpers ───────────────────────────────────────────────────────────────────

function isUserMessage(role: ChatMessageRole): boolean {
  return role === 'user'
}

function isSystemEvent(type: ChatMessageType): boolean {
  return (
    type === 'system-intercepted' ||
    type === 'system-low-confidence' ||
    type === 'system-fallback' ||
    type === 'system-error' ||
    type === 'system-timeout'
  )
}

function auditEventKey(type: ChatMessageType): string | null {
  switch (type) {
    case 'system-intercepted': return 'confidential_refused'
    case 'system-low-confidence': return 'low_confidence'
    case 'system-fallback': return 'fallback'
    default: return null
  }
}
</script>

<template>
  <div class="space-y-3 py-2">
    <div
      v-for="msg in messages"
      :key="msg.id"
      class="flex"
      :class="isUserMessage(msg.role) ? 'justify-end' : 'justify-start'"
    >
      <!-- System / audit event row (full-width centered badge) -->
      <div
        v-if="isSystemEvent(msg.type)"
        class="w-full flex justify-center"
      >
        <AuditEventBadge :event="auditEventKey(msg.type) ?? msg.type" />
      </div>

      <!-- Lead-form / handoff-status: neutral indicator -->
      <div
        v-else-if="msg.type === 'lead-form' || msg.type === 'handoff-status'"
        class="w-full flex justify-center"
      >
        <UBadge color="info" variant="subtle" size="sm">
          {{ msg.type === 'lead-form' ? 'Lead 表單提交' : '轉人工請求' }}
        </UBadge>
      </div>

      <!-- User bubble -->
      <div
        v-else-if="isUserMessage(msg.role)"
        class="max-w-[70%] flex flex-col items-end gap-0.5"
      >
        <div class="bg-primary-500 text-white rounded-2xl rounded-tr-sm px-4 py-2 text-sm">
          {{ msg.content }}
        </div>
        <!-- <span class="text-xs text-gray-400 px-1">{{ formatTimeShort(msg.timestamp) }}</span> -->
      </div>

      <!-- AI bubble -->
      <div
        v-else
        class="max-w-[70%] flex flex-col items-start gap-0.5"
      >
        <div class="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-2 text-sm shadow-sm">
          <!-- Audit metadata badge (inside bubble) -->
          <div
            v-if="msg.metadata?.interceptType"
            class="mb-1"
          >
            <AuditEventBadge
              :event="msg.metadata.interceptType === 'injection'
                ? 'prompt_guard_blocked'
                : 'confidential_refused'"
            />
          </div>

          <!-- Markdown content -->
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div
            v-if="msg.type === 'ai'"
            class="prose prose-sm max-w-none text-gray-800"
            v-html="renderMarkdown(msg.content)"
          />
          <p v-else class="text-gray-600 italic text-xs">{{ msg.content || '（系統訊息）' }}</p>

          <!-- Source references -->
          <div
            v-if="msg.metadata && 'sourceReferences' in msg.metadata
              && Array.isArray((msg.metadata as Record<string, unknown>).sourceReferences)
              && ((msg.metadata as Record<string, unknown>).sourceReferences as unknown[]).length > 0"
            class="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-400"
          >
            來源：{{ ((msg.metadata as Record<string, unknown>).sourceReferences as string[]).join('、') }}
          </div>

          <!-- Confidence score -->
          <div
            v-if="msg.metadata?.confidence !== undefined"
            class="mt-1 text-xs text-gray-400"
          >
            信心度 {{ Math.round(msg.metadata.confidence * 100) }}%
          </div>
        </div>

        <!-- Rating badge (read-only) -->
        <div v-if="msg.rating" class="flex items-center gap-1 px-1">
          <UIcon
            :name="msg.rating === 'up' ? 'i-heroicons-hand-thumb-up' : 'i-heroicons-hand-thumb-down'"
            class="w-3 h-3"
            :class="msg.rating === 'up' ? 'text-green-500' : 'text-red-400'"
          />
          <!-- <span class="text-xs text-gray-400">{{ formatTimeShort(msg.timestamp) }}</span> -->
        </div>
        <!-- <span v-else class="text-xs text-gray-400 px-1">{{ formatTimeShort(msg.timestamp) }}</span> -->
      </div>
    </div>
  </div>
</template>
