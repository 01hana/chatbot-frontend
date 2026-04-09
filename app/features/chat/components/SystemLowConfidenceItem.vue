<script setup lang="ts">
/**
 * SystemLowConfidenceItem (T-028)
 * Inline low-confidence note shown beneath an AI reply.
 */
import type { ChatMessageVM } from '~/types/chat'

defineProps<{ message: ChatMessageVM }>()
const { t } = useI18n()
</script>

<template>
  <div class="flex justify-start px-4 py-0.5">
    <div class="flex items-center gap-1.5 text-[11px] text-blue-500 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5 max-w-[85%]">
      <UIcon name="i-heroicons-information-circle" class="w-3.5 h-3.5 shrink-0" />
      <span>{{ t('chat.system.lowConfidence') }}</span>
    </div>
  </div>
</template>
