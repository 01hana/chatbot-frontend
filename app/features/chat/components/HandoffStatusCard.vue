<script setup lang="ts">
/**
 * HandoffStatusCard (T-039)
 *
 * Inline card rendered as a chat message (type = 'handoff-status').
 * Pure status display — no idle CTA.
 *
 * States:
 *   requesting  — spinner / loading
 *   transferred — static confirmation text ("已轉交專人協助")
 *
 * The handoff trigger lives upstream (e.g. ChatInputBar or a dedicated button).
 * No polling, no waiting / connected / unavailable states (Phase 3+).
 */

import { useHandoff } from '~/features/chat/composables/useHandoff'

const { t } = useI18n()
const { status } = useHandoff()
</script>

<template>
  <div
    data-testid="handoff-status-card"
    class="flex items-end gap-2 px-4 py-1"
  >
    <!-- Bot avatar -->
    <div
      class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow bg-gradient-to-br from-primary-800 to-primary-500"
    >
      <UIcon name="fluent:bot-24-regular" class="text-white" size="16" />
    </div>

    <div
      class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm max-w-sm w-full"
    >
      <!-- Requesting: spinner -->
      <div
        v-if="status === 'requesting'"
        data-testid="handoff-requesting"
        class="flex items-center gap-2 text-sm text-gray-500"
      >
        <UIcon
          name="fluent:spinner-ios-20-regular"
          class="animate-spin text-primary-500"
          size="16"
        />
        <span>{{ t('handoff.requested') }}</span>
      </div>

      <!-- Transferred: confirmation -->
      <div
        v-else-if="status === 'transferred'"
        data-testid="handoff-transferred"
        class="flex items-center gap-2 text-sm text-emerald-600"
      >
        <UIcon name="fluent:checkmark-circle-24-regular" size="16" />
        <span>{{ t('handoff.transferred') }}</span>
      </div>
    </div>
  </div>
</template>
