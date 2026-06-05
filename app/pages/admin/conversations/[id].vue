<script setup lang="ts">
/**
 * /admin/conversations/[id] — 對話詳情 (T-054)
 *
 * Refactored (Phase 3-R) to use:
 * - useFormat          — formatDateTime
 * - useFeedbackSummary — feedback computation
 * - useAdminStatus     — via AppStatusBadge (no local STATUS_LABEL)
 */

import type { ConversationDetailVM } from '~/types/admin';
import ConversationViewer from '~/features/admin/components/ConversationViewer.vue';
import AppStatusBadge from '~/features/admin/components/AppStatusBadge.vue';
import AppErrorState from '~/features/admin/components/AppErrorState.vue';
import AppEmptyState from '~/features/admin/components/AppEmptyState.vue';

definePageMeta({ layout: 'admin', title: '對話詳情' });

const route = useRoute();
const id = computed(() => String(route.params.id));

const { formatDateTime } = useFormat();
const { buildFeedbackSummary } = useFeedbackSummary();
const { get } = useAdminConversations();

// ── Data fetch ──────────────────────────────────────────────────────────────

const detail = ref<ConversationDetailVM | null>(null);
const [loading, setLoading] = useAppState(true);
const error = ref<string | null>(null);

onMounted(async () => {
  detail.value = await get(id.value);
  setLoading(false);

  console.log(detail.value);
});

// ── Feedback summary ────────────────────────────────────────────────────────

const feedbackSummary = computed(() =>
  detail.value
    ? buildFeedbackSummary(detail.value.feedbackSummary)
    : { up: 0, down: 0, reasons: [] },
);
</script>

<template>
  <div class="space-y-6">
    <!-- Back + header -->
    <div class="flex items-center gap-3">
      <UButton
        icon="i-heroicons-arrow-left"
        variant="ghost"
        color="neutral"
        size="sm"
        to="/admin/conversations"
      >
        返回列表
      </UButton>
      <h2 class="text-lg font-semibold text-gray-800">對話詳情</h2>
    </div>

    <!-- Error -->
    <AppErrorState v-if="error" :message="error" />

    <!-- Loading skeleton -->
    <div v-else-if="loading" class="space-y-4">
      <div class="h-32 rounded-xl bg-gray-100 animate-pulse" />
      <div class="h-96 rounded-xl bg-gray-100 animate-pulse" />
    </div>

    <!-- Empty -->
    <AppEmptyState v-else-if="!detail" title="找不到對話紀錄" />

    <template v-else>
      <!-- Session metadata card -->
      <UCard class="py-4">
        <template #header>
          <p class="text-sm font-medium text-gray-700">Session 資訊</p>
        </template>
        <dl class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-4 text-sm">
          <div>
            <dt class="text-gray-500 text-xs">Session ID</dt>
            <dd class="font-mono text-gray-800 mt-0.5" :title="detail.sessionId">
              {{ detail.sessionId }}
            </dd>
          </div>
          <div>
            <dt class="text-gray-500 text-xs">對話輪數</dt>
            <dd class="text-gray-800 mt-0.5">{{ detail.messageCount }}</dd>
          </div>
          <div>
            <dt class="text-gray-500 text-xs">開始時間</dt>
            <dd class="text-gray-800 mt-0.5">{{ formatDateTime(detail.createdAt) }}</dd>
          </div>
          <div>
            <dt class="text-gray-500 text-xs">最後更新時間</dt>
            <dd class="text-gray-800 mt-0.5">{{ formatDateTime(detail.updatedAt) }}</dd>
          </div>

          <div>
            <dt class="text-gray-500 text-xs">狀態</dt>
            <dd class="mt-0.5">
              <AppStatusBadge :status="detail.status" />
            </dd>
          </div>
          <div>
            <dt class="text-gray-500 text-xs">Lead 提交</dt>
            <dd class="mt-0.5">
              <UBadge
                :color="detail.leadSubmitted ? 'success' : 'neutral'"
                variant="subtle"
                size="md"
              >
                {{ detail.leadSubmitted ? '已提交' : '未提交' }}
              </UBadge>
            </dd>
          </div>
        </dl>
      </UCard>

      <!-- Conversation viewer -->
      <UCard>
        <template #header>
          <p class="text-sm font-medium text-gray-700">對話內容</p>
        </template>
        <div class="max-h-[600px] overflow-y-auto px-2 py-4">
          <ConversationViewer :messages="detail.messages" />
        </div>
      </UCard>

      <!-- Feedback summary -->
      <UCard class="py-4">
        <template #header>
          <p class="text-sm font-medium text-gray-700">回饋摘要</p>
        </template>
        <div class="flex flex-wrap gap-6 text-sm">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-hand-thumb-up" class="w-4 h-4 text-green-500" />
            <span class="text-gray-700"
              >正面回饋：<strong>{{ feedbackSummary.up }}</strong></span
            >
          </div>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-hand-thumb-down" class="w-4 h-4 text-red-400" />
            <span class="text-gray-700"
              >負面回饋：<strong>{{ feedbackSummary.down }}</strong></span
            >
          </div>
        </div>
        <ul v-if="feedbackSummary.reasons.length > 0" class="mt-3 space-y-1 text-xs text-gray-500">
          <li v-for="r in feedbackSummary.reasons" :key="r.label">
            {{ r.label }}：{{ r.count }} 次
          </li>
        </ul>
      </UCard>
    </template>
  </div>
</template>
