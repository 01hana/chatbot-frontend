<script setup lang="ts">
/**
 * /admin/tickets — Ticket 管理列表 (T-056, Phase 3 refactor)
 *
 * Uses useAdminTablePage to centralise page/sort/filter/URL/data state.
 * Row transform (mapRows) replaces the local displayRows computed.
 */

import { listTickets } from '~/services/api/admin/tickets';
import type { TicketVM, TicketListParams, TicketStatus, TicketPriority } from '~/types/admin';
import type { FilterDef } from '~/features/admin/components/AdminFilterBar.vue';
import AppPageHeader from '~/features/admin/components/AppPageHeader.vue';
import AdminFilterBar from '~/features/admin/components/AdminFilterBar.vue';
import AdminDataTable from '~/features/admin/components/AdminDataTable.vue';
import AppErrorState from '~/features/admin/components/AppErrorState.vue';

definePageMeta({ layout: 'admin', title: 'Ticket 管理' });

const router = useRouter();
const { formatDateTime } = useFormat();
const { getTicketStatusLabel, getTicketPriorityLabel } = useAdminStatus();

// ── Table page composable ──────────────────────────────────────────────────

type TicketFilters = { status: string; priority: string; startDate: string; endDate: string };
type DisplayTicket = TicketVM & {
  titleDisplay: string;
  statusLabel: string;
  createdAtDisplay: string;
  priorityLabel: string;
};

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
} = useAdminTablePage<TicketFilters, TicketListParams, TicketVM, DisplayTicket>({
  pageSize: 20,
  filterQueryKeys: ['status', 'priority', 'startDate', 'endDate'],
  buildParams: ctx => {
    const p: TicketListParams = { page: ctx.page, pageSize: ctx.pageSize };
    if (ctx.keyword) p.keyword = ctx.keyword;
    if (ctx.filters.status) p.status = ctx.filters.status as TicketStatus;
    if (ctx.filters.priority) p.priority = ctx.filters.priority as TicketPriority;
    if (ctx.filters.startDate) p.startDate = ctx.filters.startDate;
    if (ctx.filters.endDate) p.endDate = ctx.filters.endDate;
    if (ctx.sortBy) p.sortBy = ctx.sortBy;
    if (ctx.sortOrder) p.sortOrder = ctx.sortOrder;
    return p;
  },
  fetcher: listTickets,
  mapRows: raw =>
    raw.map(ticket => ({
      ...ticket,
      titleDisplay: ticket.title || '-',
      statusLabel: getTicketStatusLabel(ticket.status),
      createdAtDisplay: formatDateTime(ticket.createdAt),
      priorityLabel: ticket.priority ? getTicketPriorityLabel(ticket.priority) : '-',
    })),
});

onMounted(fetchData);

// ── Row click ──────────────────────────────────────────────────────────────

function onRowClick(row: { id: string }) {
  router.push(`/admin/tickets/${row.id}`);
}

// ── Filter bar ─────────────────────────────────────────────────────────────

const filterDefs: FilterDef[] = [
  {
    key: 'keyword',
    label: '關鍵字',
    type: 'keyword',
    placeholder: '搜尋 Ticket…',
  },
  {
    key: 'status',
    label: '狀態',
    type: 'select',
    options: [
      { label: '全部', value: 'all' },
      { label: '開啟', value: 'open' },
      { label: '處理中', value: 'in_progress' },
      { label: '已解決', value: 'resolved' },
      { label: '已關閉', value: 'closed' },
    ],
  },
  {
    key: 'priority',
    label: '優先級',
    type: 'select',
    options: [
      { label: '全部', value: 'all' },
      { label: '低', value: 'low' },
      { label: '中', value: 'medium' },
      { label: '高', value: 'high' },
    ],
  },
  { key: 'dateRange', label: '時間範圍', type: 'date-range' },
];

// ── Table columns ──────────────────────────────────────────────────────────

const columns = [
  { accessorKey: 'id', header: 'Ticket ID' },
  { accessorKey: 'titleDisplay', header: '主旨' },
  { accessorKey: 'statusLabel', header: '狀態' },
  { accessorKey: 'priorityLabel', header: '優先級' },
  { accessorKey: 'createdAtDisplay', header: '建立時間', sortable: true },
];
</script>

<template>
  <div class="space-y-4">
    <AppPageHeader title="Ticket 管理" />

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
      empty-text="目前沒有 Ticket 資料"
      @update:page="onPageChange"
      @update:sort="onSort"
      @row-click="onRowClick"
    />
  </div>
</template>
