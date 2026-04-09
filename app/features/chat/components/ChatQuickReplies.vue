<script setup lang="ts">
/**
 * ChatQuickReplies (T-021)
 *
 * Horizontal chip row of quick-reply shortcuts.
 *  - Sourced from useWidgetConfigStore.config.quickReplies (locale-aware)
 *  - Hidden when: config not loaded / quickReplies empty / user already clicked one
 *  - All chips disabled while streaming
 *
 * Emits:
 *  - select(text: string)  — parent / T-027 useChat will call sendMessage(text)
 */

const emit = defineEmits<{
  select: [text: string]
}>()

const { t } = useI18n()
const sessionStore = useChatSessionStore()
const configStore = useWidgetConfigStore()
const widgetStore = useChatWidgetStore()

const locale = computed(() => widgetStore.locale as 'zh-TW' | 'en')

const isStreaming = computed(() =>
  sessionStore.streamingState === 'streaming' ||
  sessionStore.streamingState === 'sending',
)

const chips = computed(() => configStore.config?.quickReplies ?? [])

const visible = computed(() =>
  chips.value.length > 0 && sessionStore.quickRepliesVisible,
)

function select(text: string) {
  if (isStreaming.value) return
  sessionStore.setQuickRepliesVisible(false)
  emit('select', text)
}
</script>

<template>
  <div
    v-if="visible"
    class="px-3 py-2 flex gap-2 overflow-x-auto scrollbar-none border-t border-gray-100"
    :aria-label="t('chat.quickReplies.label')"
  >
    <button
      v-for="(chip, i) in chips"
      :key="i"
      :disabled="isStreaming"
      class="
        shrink-0 px-3 py-1.5 rounded-full border border-primary-300
        text-xs text-primary-600 font-medium bg-white
        hover:bg-primary-50 active:bg-primary-100
        disabled:opacity-40 disabled:cursor-not-allowed
        transition-colors whitespace-nowrap
      "
      @click="select(chip[locale] || chip['zh-TW'])"
    >
      {{ chip[locale] || chip['zh-TW'] }}
    </button>
  </div>
</template>
