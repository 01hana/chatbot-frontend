<script setup lang="ts">
/**
 * SystemTimeoutItem (T-028)
 * Rendered for type = 'system-timeout'.
 */
import type { ChatMessageVM } from '~/types/chat'

defineProps<{ message: ChatMessageVM }>()
const { t } = useI18n()
const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="flex justify-start px-4 py-1">
    <div class="flex items-start gap-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl px-3.5 py-2.5 text-sm max-w-[85%]">
      <UIcon name="i-heroicons-clock" class="w-4 h-4 shrink-0 mt-0.5" />
      <div class="flex flex-col gap-1.5">
        <span>{{ t('chat.streaming.timeout') }}</span>
        <button
          class="self-start text-xs font-medium underline underline-offset-2 hover:text-amber-900"
          @click="emit('retry')"
        >
          {{ t('chat.streaming.retry') }}
        </button>
      </div>
    </div>
  </div>
</template>
