<script setup lang="ts">
// T-052 — /admin/dashboard
import { getDashboardStats } from '~/services/api/admin/dashboard';
import type { DashboardStatsVM, AuditEventVM } from '~/types/admin';
import AdminPieChart from '~/features/admin/components/AdminPieChart.vue';
import AdminLineChart from '~/features/admin/components/AdminLineChart.vue';
import AdminStatCard from '~/features/admin/components/AdminStatCard.vue';
import AppPageHeader from '~/features/admin/components/AppPageHeader.vue';
import AppEmptyState from '~/features/admin/components/AppEmptyState.vue';
import AppErrorState from '~/features/admin/components/AppErrorState.vue';

definePageMeta({
  layout: 'admin',
  title: '儀表板',
});

// ── Data fetch ────────────────────────────────────────────────────────────────

const stats = ref<DashboardStatsVM | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

async function fetchStats() {
  loading.value = true;
  error.value = null;
  try {
    stats.value = await getDashboardStats();
  } catch (e) {
    error.value = e instanceof Error ? e.message : '載入失敗';
  } finally {
    loading.value = false;
  }
}

onMounted(fetchStats);

// ── Derived helpers ──────────────────────────────────────────────────────────

const latestAuditEvents = computed<AuditEventVM[]>(() =>
  (stats.value?.latestAuditEvents ?? []).slice(0, 5),
);

const { formatDateTime } = useFormat();
</script>

<template>
  <div class="space-y-6">
    <!-- Page header -->
    <AppPageHeader title="儀表板" description="AI 客服聊天機器人後台概覽" />

    <!-- Error state -->
    <AppErrorState v-if="error" :message="error" @retry="fetchStats" />

    <template v-else>
      <!-- ── Stat Cards ─────────────────────────────────────────────────── -->
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <AdminStatCard
          title="今日對話數"
          :value="stats?.todayConversations ?? 0"
          icon="i-heroicons-chat-bubble-left-right"
          :loading="loading"
        />
        <AdminStatCard
          title="本月對話數"
          :value="stats?.monthlyConversations ?? stats?.monthConversations ?? 0"
          icon="i-heroicons-calendar-days"
          :loading="loading"
        />
        <AdminStatCard
          title="AI 自助解答率"
          :value="stats ? `${stats.aiResolutionRate ?? stats.selfServiceRate}%` : '—'"
          icon="i-heroicons-cpu-chip"
          :loading="loading"
        />
        <AdminStatCard
          title="待處理 Ticket"
          :value="stats?.pendingTickets ?? 0"
          icon="i-heroicons-ticket"
          to="/admin/tickets?status=open"
          :loading="loading"
        />
        <AdminStatCard
          title="本月新增 Lead"
          :value="stats?.monthlyLeads ?? stats?.newLeadsThisMonth ?? 0"
          icon="i-heroicons-user-plus"
          to="/admin/leads"
          :loading="loading"
        />
      </div>

      <!-- ── Charts row ─────────────────────────────────────────────────── -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Line chart: conversation trend -->
        <div class="lg:col-span-2">
          <div v-if="loading" class="h-64 rounded-xl bg-gray-100 animate-pulse" />
          <AdminLineChart v-else :data="stats?.conversationTrend ?? []" />
        </div>

        <!-- Pie chart: intent distribution -->
        <div>
          <div v-if="loading" class="h-64 rounded-xl bg-gray-100 animate-pulse" />
          <AdminPieChart v-else title="意圖分布" :data="stats?.intentDistribution ?? []" />
        </div>
      </div>

      <!-- ── Handoff reason distribution ──────────────────────────────── -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <div v-if="loading" class="h-56 rounded-xl bg-gray-100 animate-pulse" />
          <AdminPieChart
            v-else
            title="轉人工原因分布"
            :data="stats?.handoffReasonDistribution ?? []"
          />
        </div>

        <!-- ── Latest audit events ─────────────────────────────────────── -->
        <UCard>
          <template #header>
            <p class="text-sm font-medium text-gray-700">最新稽核事件</p>
          </template>

          <div v-if="loading" class="space-y-3">
            <div v-for="i in 5" :key="i" class="h-5 rounded bg-gray-100 animate-pulse" />
          </div>

          <AppEmptyState v-else-if="latestAuditEvents.length === 0" title="暫無稽核事件" />

          <ul v-else class="divide-y divide-gray-100 text-sm">
            <li v-for="evt in latestAuditEvents" :key="evt.id" class="py-2">
              <NuxtLink
                :to="`/admin/audit/${evt.id}`"
                class="flex items-start justify-between gap-2 hover:text-primary-600 transition-colors"
              >
                <div class="flex-1 min-w-0">
                  <span class="font-medium text-gray-800">{{ evt.eventType }}</span>
                  <span v-if="evt.sessionId" class="ml-2 text-gray-400 text-xs truncate">
                    {{ evt.sessionId }}
                  </span>
                </div>
                <span class="shrink-0 text-xs text-gray-400">{{
                  formatDateTime(evt.createdAt)
                }}</span>
              </NuxtLink>
            </li>
          </ul>
        </UCard>
      </div>
    </template>
  </div>
</template>
