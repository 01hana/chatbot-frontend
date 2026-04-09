<script setup lang="ts">
/**
 * SystemErrorItem (T-028)
 * Rendered for type = 'system-error' (covers error / interrupted / cancelled).
 */
import type { ChatMessageVM } from '~/types/chat';

defineProps<{ message: ChatMessageVM }>();

const { t } = useI18n();

const emit = defineEmits<{ retry: [] }>();
</script>

<template>
  <div class="flex justify-start px-4 py-1">
    <div
      class="flex items-start gap-2 bg-red-50 text-red-700 border border-red-200 rounded-xl px-3.5 py-2.5 text-sm max-w-[85%]"
    >
      <UIcon name="i-heroicons-exclamation-circle" class="w-4 h-4 shrink-0 mt-0.5" />
      <div class="flex flex-col gap-1.5">
        <span>{{ t('streaming.error') }}</span>
        <UButton
          :label="t('streaming.retry')"
          variant="link"
          color="error"
          class="self-start text-xs font-medium underline underline-offset-2 hover:text-red-900"
          @click="emit('retry')"
        />
      </div>
    </div>
  </div>
</template>
