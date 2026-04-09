<script setup lang="ts">
/**
 * UserMessageItem (T-028)
 * Right-aligned user bubble with avatar and timestamp.
 */
import type { ChatMessageVM } from '~/types/chat';
import { formatRelativeTime } from '~/utils/format';

const props = defineProps<{ message: ChatMessageVM }>();
</script>

<template>
  <div class="flex items-end justify-end gap-2 px-4 py-1 group">
    <!-- Bubble + timestamp -->
    <div class="flex flex-col items-end gap-1 max-w-[75%]">
      <div
        class="bg-gradient-to-br from-primary-800 to-primary-500 text-white px-3.5 py-2.5 rounded-[16px_16px_4px_16px] text-sm leading-relaxed break-words shadow-sm"
      >
        {{ props.message.content }}
      </div>
      <time class="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
        {{ formatRelativeTime(props.message.timestamp) }}
      </time>
    </div>

    <!-- User avatar -->
    <div
      class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow bg-gradient-to-br from-slate-500 to-slate-700"
    >
      <UIcon name="fluent:person-24-regular" class="text-white" size="16" />
    </div>
  </div>
</template>
