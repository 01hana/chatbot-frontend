<script setup lang="ts">
/**
 * ChatMessageArea (T-028)
 *
 * Renders the full message list by mapping each ChatMessageVM.type to its
 * component via a registry map — avoids a giant v-if chain.
 *
 * Auto-scrolls to the bottom whenever messages change.
 */

import type { ChatMessageVM } from '~/types/chat';
import UserMessageItem from './UserMessageItem.vue';
import AiMessageItem from './AiMessageItem.vue';
import AiStreamingItem from './AiStreamingItem.vue';
import SystemErrorItem from './SystemErrorItem.vue';
import SystemTimeoutItem from './SystemTimeoutItem.vue';
import SystemInterceptedItem from './SystemInterceptedItem.vue';
import SystemLowConfidenceItem from './SystemLowConfidenceItem.vue';
import SystemFallbackItem from './SystemFallbackItem.vue';
import { renderMarkdown } from '~/utils/markdown';

// ── Component registry ────────────────────────────────────────────────────

type MessageComponent = ReturnType<typeof defineComponent>;
const componentMap: Record<ChatMessageVM['type'], MessageComponent> = {
  user: UserMessageItem,
  ai: AiMessageItem,
  'ai-streaming': AiStreamingItem,
  'system-error': SystemErrorItem,
  'system-timeout': SystemTimeoutItem,
  'system-intercepted': SystemInterceptedItem,
  'system-low-confidence': SystemLowConfidenceItem,
  'system-fallback': SystemFallbackItem,
  // Phase 2 items — rendered as empty div until implemented
  'lead-form': defineComponent({ template: '<div />' }),
  'handoff-status': defineComponent({ template: '<div />' }),
};

// ── Props / emits ─────────────────────────────────────────────────────────

const props = defineProps<{
  messages: ChatMessageVM[];
}>();

const emit = defineEmits<{
  retry: [messageId: string];
  rate: [messageId: string, value: import('~/types/chat').FeedbackValue];
  'quick-reply': [text: string];
}>();

// ── Auto-scroll ───────────────────────────────────────────────────────────

const bottomRef = ref<HTMLElement | null>(null);

watch(
  () => props.messages.length,
  async () => {
    await nextTick();
    bottomRef.value?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  },
);

// Also scroll on content changes (streaming tokens)
watch(
  () => props.messages.at(-1)?.content,
  async () => {
    await nextTick();
    bottomRef.value?.scrollIntoView({ behavior: 'smooth' });
  },
);

const kbStore = useKnowledgeBaseStore();
const welcome = computed(() => kbStore.query('hello'));
const welcomeHtml = computed(() => renderMarkdown(welcome.value.content));
</script>

<template>
  <div class="flex flex-col py-3 min-h-full">
    <!-- Empty state -->
    <div v-if="!messages.length" class="flex items-end gap-2 px-4 py-1 group">
      <div class="flex gap-3">
        <div
          class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow bg-gradient-to-br from-primary-800 to-primary-500"
        >
          <UIcon name="fluent:bot-24-regular" class="text-white" size="16" />
        </div>

        <div class="flex flex-col items-start gap-1 max-w-[75%]">
          <div
            class="bg-white border border-gray-200 text-gray-800 px-3.5 py-2.5 rounded-[16px_16px_16px_4px] text-sm leading-relaxed shadow-sm prose prose-sm max-w-none"
            v-html="welcomeHtml"
          />

          <div v-if="welcome.quickReplies?.length" class="flex flex-wrap gap-2 mt-3">
            <UButton
              v-for="reply in welcome.quickReplies"
              :key="reply"
              :label="reply"
              variant="outline"
              size="sm"
              class="rounded-full cursor-pointer"
              @click="emit('quick-reply', reply)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Message list -->
    <template v-else>
      <component
        :is="componentMap[message.type]"
        v-for="message in messages"
        :key="message.id"
        :message
        @retry="emit('retry', message.id)"
        @rate="(id: string, val: import('~/types/chat').FeedbackValue) => emit('rate', id, val)"
        @quick-reply="(text: string) => emit('quick-reply', text)"
      />
    </template>

    <!-- Scroll anchor -->
    <div ref="bottomRef" class="h-px shrink-0" aria-hidden="true" />
  </div>
</template>
