<script setup lang="ts">
/**
 * AiMessageItem (T-028)
 * Left-aligned AI bubble with avatar, markdown rendering + timestamp.
 * Includes thumb-like / thumb-dislike feedback buttons and quick-reply chips.
 */
import type { ChatMessageVM, FeedbackValue } from '~/types/chat'
import { formatRelativeTime } from '~/utils/format'
import { renderMarkdown } from '~/utils/markdown'

const props = defineProps<{ message: ChatMessageVM }>()

const emit = defineEmits<{
  rate: [id: string, value: FeedbackValue]
  'quick-reply': [text: string]
}>()

const html = computed(() => renderMarkdown(props.message.content))

const timeStr = computed(() =>
  new Date(props.message.timestamp).toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
  }),
)
</script>

<template>
  <div class="flex items-end gap-2 px-4 py-1 group">
    <!-- Bot avatar -->
    <div
      class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow bg-gradient-to-br from-primary-800 to-primary-500"
    >
      <UIcon name="fluent:bot-24-regular" class="text-white" size="16" />
    </div>

    <!-- Bubble + timestamp + feedback + quick-replies -->
    <div class="flex flex-col items-start gap-1 max-w-[75%]">
      <div
        class="bg-white border border-gray-200 text-gray-800 px-3.5 py-2.5 rounded-[16px_16px_16px_4px] text-sm leading-relaxed shadow-sm prose prose-sm max-w-none"
        v-html="html"
      />

      <!-- Timestamp + feedback row -->
      <div class="flex items-center gap-2 px-1">
        <span class="text-[10px] text-gray-400">{{ timeStr }}</span>

        <!-- Thumb buttons -->
        <div class="flex gap-1">
          <UButton
            color="neutral"
            variant="ghost"
            size="xs"
            class="!p-0.5 transition-colors"
            :class="message.rating === 'up' ? 'text-emerald-500' : 'text-gray-300 hover:text-gray-500'"
            :aria-label="'讚'"
            @click="emit('rate', message.id, 'up')"
          >
            <UIcon name="fluent:thumb-like-24-regular" size="13" />
          </UButton>
          <UButton
            color="neutral"
            variant="ghost"
            size="xs"
            class="!p-0.5 transition-colors"
            :class="message.rating === 'down' ? 'text-red-400' : 'text-gray-300 hover:text-gray-500'"
            :aria-label="'倒讚'"
            @click="emit('rate', message.id, 'down')"
          >
            <UIcon name="fluent:thumb-dislike-24-regular" size="13" />
          </UButton>
        </div>
      </div>

      <!-- Quick-reply chips (per-message) -->
      <div v-if="message.quickReplies?.length" class="flex flex-wrap gap-2 mt-1">
        <button
          v-for="reply in message.quickReplies"
          :key="reply"
          class="shrink-0 px-3 py-1.5 rounded-full border border-primary-300 text-xs text-primary-600 font-medium bg-white hover:bg-primary-50 active:bg-primary-100 transition-colors whitespace-nowrap"
          @click="emit('quick-reply', reply)"
        >
          {{ reply }}
        </button>
      </div>
    </div>
  </div>
</template>
