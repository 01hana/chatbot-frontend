<script setup lang="ts">
/**
 * SystemInterceptedItem (T-028)
 * Rendered for type = 'system-intercepted'.
 * Uses metadata.interceptType ('secret' | 'injection') to vary icon + colour.
 */
import type { ChatMessageVM } from '~/types/chat'

const props = defineProps<{ message: ChatMessageVM }>()
const { t } = useI18n()

const isInjection = computed(() => props.message.metadata?.interceptType === 'injection')

const icon = computed(() =>
  isInjection.value ? 'i-heroicons-shield-exclamation' : 'i-heroicons-lock-closed',
)

const text = computed(() =>
  isInjection.value
    ? t('chat.system.intercepted.injection')
    : t('chat.system.intercepted.secret'),
)
</script>

<template>
  <div class="flex justify-start px-4 py-1">
    <div
      class="flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-sm max-w-[85%] border"
      :class="
        isInjection
          ? 'bg-intercept-injection text-intercept-injection-text border-red-200'
          : 'bg-intercept-warning text-intercept-warning-text border-amber-200'
      "
    >
      <UIcon :name="icon" class="w-4 h-4 shrink-0 mt-0.5" />
      <span>{{ text }}</span>
    </div>
  </div>
</template>
