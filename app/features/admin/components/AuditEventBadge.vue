<script setup lang="ts">
/**
 * AuditEventBadge (T-054)
 * Inline badge for special audit events embedded in conversation messages.
 */

type EventKey =
  | 'confidential_refused'
  | 'prompt_guard_blocked'
  | 'sensitive_intent_alert'
  | 'handoff'
  | 'fallback'
  | 'low_confidence'

interface EventConfig {
  label: string
  color: 'error' | 'warning' | 'info' | 'neutral' | 'success'
  icon: string
}

const EVENT_MAP: Record<EventKey, EventConfig> = {
  confidential_refused:  { label: '機密攔截', color: 'error',   icon: 'i-heroicons-shield-exclamation' },
  prompt_guard_blocked:  { label: 'Prompt 注入防護', color: 'error',   icon: 'i-heroicons-no-symbol' },
  sensitive_intent_alert:{ label: '敏感意圖警示', color: 'warning', icon: 'i-heroicons-exclamation-triangle' },
  handoff:               { label: '轉人工', color: 'info',    icon: 'i-heroicons-user' },
  fallback:              { label: 'Fallback', color: 'neutral', icon: 'i-heroicons-question-mark-circle' },
  low_confidence:        { label: '低信心度', color: 'warning', icon: 'i-heroicons-signal-slash' },
}

const FALLBACK_CONFIG: EventConfig = { label: '事件', color: 'neutral', icon: 'i-heroicons-information-circle' }

const props = defineProps<{
  event: string
}>()

const config = computed<EventConfig>(() =>
  (props.event in EVENT_MAP ? EVENT_MAP[props.event as EventKey] : FALLBACK_CONFIG)
)
</script>

<template>
  <UBadge :color="config.color" variant="subtle" size="sm" class="inline-flex items-center gap-1">
    <UIcon :name="config.icon" class="w-3 h-3" />
    {{ config.label }}
  </UBadge>
</template>
