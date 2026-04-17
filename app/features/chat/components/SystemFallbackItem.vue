<script setup lang="ts">
/**
 * SystemFallbackItem (T-028)
 * Shown when AI enters fallback mode — includes a "Contact us" shortcut.
 */
import type { ChatMessageVM } from '~/types/chat'

defineProps<{ message: ChatMessageVM }>()
const { t, locale } = useI18n()
const configStore = useWidgetConfigStore()
</script>

<template>
  <div class="flex justify-start px-4 py-1">
    <div class="flex flex-col gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-sm max-w-[85%]">
      <div class="flex items-center gap-2 text-gray-600">
        <UIcon name="i-heroicons-face-frown" class="w-4 h-4 shrink-0" />
        <span>{{ t('chat.system.fallback') }}</span>
      </div>
      <!-- Service-hours hint (if available) -->
      <p v-if="configStore.config?.serviceHours?.[locale]" class="text-[11px] text-gray-500">
        {{ configStore.config.serviceHours[locale] }}
      </p>
      <!-- Contact us shortcut -->
      <UButton
        variant="outline"
        size="xs"
        color="neutral"
        :label="t('chat.widget.fallback.contactUs')"
        leading-icon="i-heroicons-phone"
        class="self-start"
      />
    </div>
  </div>
</template>
