<script setup lang="ts">
/**
 * AiMessageItem (T-028)
 * Left-aligned AI bubble with avatar, markdown rendering, relative timestamp,
 * inline feedback (thumb up/down) and per-message quick-reply chips.
 *
 * Also handles ai-streaming state: shows TypingIndicator when
 * message.type === 'ai-streaming' and content is empty.
 */
import type { ChatMessageVM, FeedbackValue } from '~/types/chat';
import { formatDateTime } from '~/utils/format';
import { renderMarkdown } from '~/utils/markdown';

const props = defineProps<{ message: ChatMessageVM }>();

const emit = defineEmits<{
  rate: [id: string, value: FeedbackValue];
  'quick-reply': [text: string];
}>();

const html = computed(() => renderMarkdown(props.message.content));
const timeStr = computed(() => formatDateTime(props.message.timestamp));

// Typing indicator: ai-streaming with no tokens yet
const isStreaming = computed(() => props.message.type === 'ai-streaming');
</script>

<template>
  <div data-testid="ai-message" class="flex items-end gap-2 px-4 py-1 group">
    <!-- Bot avatar -->
    <div
      class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow bg-gradient-to-br from-primary-800 to-primary-500"
    >
      <UIcon name="fluent:bot-24-regular" class="text-white" size="16" />
    </div>

    <div class="flex flex-col items-start gap-1 max-w-[75%]">
      <!-- Typing indicator (ai-streaming, no tokens) -->
      <div
        v-if="isStreaming"
        data-testid="typing-indicator"
        class="rounded-[16px_16px_16px_4px] px-4 py-3 shadow-sm bg-white border border-gray-200"
      >
        <div class="flex gap-1.5 items-center h-4">
          <span
            v-for="delay in [0, 150, 300]"
            :key="delay"
            class="w-2 h-2 rounded-full animate-bounce bg-primary-600 opacity-60"
            :style="{ animationDelay: `${delay}ms` }"
          />
        </div>
      </div>

      <!-- AI message bubble -->
      <div
        v-else
        data-testid="ai-bubble"
        class="bg-white border border-gray-200 text-gray-800 px-3.5 py-2.5 rounded-[16px_16px_16px_4px] text-sm leading-relaxed shadow-sm prose prose-sm max-w-none"
        v-html="html"
      />

      <!-- Timestamp + feedback row (always visible for ai messages) -->
      <div v-if="!isStreaming" class="flex items-center gap-2 px-1">
        <time data-testid="message-time" class="text-[10px] text-gray-400">{{ timeStr }}</time>

        <!-- Thumb buttons (ref: ChatBubble.vue UButton block) -->
        <div class="flex gap-1">
          <UButton
            data-testid="btn-rate-up"
            color="neutral"
            variant="ghost"
            size="xs"
            class="!p-0.5 transition-colors"
            :class="
              message.rating === 'up' ? 'text-emerald-500' : 'text-gray-300 hover:text-gray-500'
            "
            @click="emit('rate', message.id, 'up')"
          >
            <UIcon name="fluent:thumb-like-24-regular" size="13" />
          </UButton>

          <UButton
            data-testid="btn-rate-down"
            color="neutral"
            variant="ghost"
            size="xs"
            class="!p-0.5 transition-colors"
            :class="
              message.rating === 'down' ? 'text-red-400' : 'text-gray-300 hover:text-gray-500'
            "
            @click="emit('rate', message.id, 'down')"
          >
            <UIcon name="fluent:thumb-dislike-24-regular" size="13" />
          </UButton>
        </div>
      </div>

      <!-- Per-message quick-reply chips -->
      <div v-if="!isStreaming && message.quickReplies?.length" data-testid="quick-reply-chips" class="flex flex-wrap gap-2 mt-1">
        <UButton
          v-for="reply in message.quickReplies"
          :key="reply"
          :label="reply"
          class="shrink-0 px-3 py-1.5 rounded-full border border-primary-300 text-xs text-primary-600 font-medium bg-white hover:bg-primary-50 active:bg-primary-100 transition-colors whitespace-nowrap"
          @click="emit('quick-reply', reply)"
        />
      </div>
    </div>
  </div>
</template>
