<script setup lang="ts">
/**
 * /admin/conversations — 對話紀錄列表 (T-053, Phase 3 refactor)
 *
 * Uses useAdminTablePage to centralise page/sort/filter/URL/data state.
 */

import { listConversations, exportConversations } from '~/services/api/admin/conversations';
import type { ConversationSummaryVM, ConversationListParams } from '~/types/admin';
import type { FilterDef } from '~/features/admin/components/AdminFilterBar.vue';
import AppPageHeader from '~/features/admin/components/AppPageHeader.vue';
import AdminFilterBar from '~/features/admin/components/AdminFilterBar.vue';
import AdminDataTable from '~/features/admin/components/AdminDataTable.vue';
import AppErrorState from '~/features/admin/components/AppErrorState.vue';

definePageMeta({ layout: 'admin', title: '對話紀錄' });

const router = useRouter();
const toast = useAppToast();
const { downloadUrl, buildTimestampedFilename } = useAdminDownload();

// ── Table page composable ──────────────────────────────────────────────────

type ConvFilters = { status: string; startDate: string; endDate: string };

const {
  displayRows,
  total,
  loading,
  error,
  page,
  pageSize,
  filterValues,
  fetchData,
  onFiltersUpdate,
  onSort,
  onPageChange,
  buildCurrentParams,
} = useAdminTablePage<ConvFilters, ConversationListParams, ConversationSummaryVM>({
  pageSize: 20,
  filterQueryKeys: ['status', 'startDate', 'endDate'],
  buildParams: ctx => {
    const p: ConversationListParams = { page: ctx.page, pageSize: ctx.pageSize };
    if (ctx.keyword) p.keyword = ctx.keyword;
    if (ctx.filters.status) p.status = ctx.filters.status as ConversationListParams['status'];
    if (ctx.filters.startDate) p.startDate = ctx.filters.startDate;
    if (ctx.filters.endDate) p.endDate = ctx.filters.endDate;
    if (ctx.sortBy) p.sortBy = ctx.sortBy;
    if (ctx.sortOrder) p.sortOrder = ctx.sortOrder;
    return p;
  },
  fetcher: listConversations,
});

onMounted(fetchData);

// ── Row click ──────────────────────────────────────────────────────────────

function onRowClick(row: ConversationSummaryVM) {
  router.push(`/admin/conversations/${row.sessionId}`);
}

// ── Export ─────────────────────────────────────────────────────────────────

const exporting = ref(false);

async function handleExport() {
  exporting.value = true;
  try {
    const { url } = await exportConversations(buildCurrentParams());
    downloadUrl(url, buildTimestampedFilename('conversations', 'csv'));
    toast.success('匯出成功');
  } catch (e) {
    toast.error(e instanceof Error ? e.message : '匯出失敗，請稍後再試');
  } finally {
    exporting.value = false;
  }
}

// ── Filter bar ─────────────────────────────────────────────────────────────

const filterDefs: FilterDef[] = [
  {
    key: 'keyword',
    label: '關鍵字',
    type: 'keyword',
    placeholder: '搜尋 Session ID…',
  },
  {
    key: 'status',
    label: '狀態',
    type: 'select',
    options: [
      { label: '全部', value: 'all' },
      { label: 'Active', value: 'active' },
      { label: 'Closed', value: 'closed' },
      { label: 'Handoff', value: 'handoff' },
    ],
  },
  { key: 'dateRange', label: '時間範圍', type: 'date-range' },
];

// ── Table columns ──────────────────────────────────────────────────────────

const columns = [
  { accessorKey: 'sessionId', header: 'Session ID', sortable: true },
  { accessorKey: 'messageCount', header: '對話輪數', sortable: true },
  { accessorKey: 'status', header: '狀態' },
  { accessorKey: 'leadSubmitted', header: 'Lead' },
  { accessorKey: 'createdAt', header: '開始時間', sortable: true },
];
</script>

<template>
  <div class="space-y-4">
    <AppPageHeader title="對話紀錄">
      <template #actions>
        <UButton
          icon="i-heroicons-arrow-down-tray"
          variant="outline"
          color="neutral"
          size="sm"
          :loading="exporting"
          @click="handleExport"
        >
          匯出 CSV
        </UButton>
      </template>
    </AppPageHeader>

    <!-- Filter bar -->
    <AdminFilterBar
      :filters="filterDefs"
      :model-value="filterValues"
      @update:filters="onFiltersUpdate"
    />

    <!-- Error state -->
    <AppErrorState v-if="error" :message="error" @retry="fetchData" />

    <!-- Table -->
    <AdminDataTable
      v-else
      :columns="columns"
      :data="displayRows"
      :total="total"
      :page="page"
      :page-size="pageSize"
      :loading="loading"
      empty-text="目前沒有對話紀錄"
      @update:page="onPageChange"
      @update:sort="onSort"
      @row-click="onRowClick"
    />
  </div>
</template>
