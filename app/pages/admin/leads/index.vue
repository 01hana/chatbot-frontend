<script setup lang="ts">
/**
 * /admin/leads — Lead 管理列表 (T-055, Phase 3 refactor)
 *
 * Uses useAdminTablePage to centralise page/sort/filter/URL/data state.
 * Row transform (mapRows) replaces the local displayRows computed.
 */

import { listLeads } from '~/services/api/admin/leads';
import type { LeadVM, LeadListParams, LeadStatus } from '~/types/admin';
import type { FilterDef } from '~/features/admin/components/AdminFilterBar.vue';
import AppPageHeader from '~/features/admin/components/AppPageHeader.vue';
import AdminFilterBar from '~/features/admin/components/AdminFilterBar.vue';
import AdminDataTable from '~/features/admin/components/AdminDataTable.vue';
import AppErrorState from '~/features/admin/components/AppErrorState.vue';

definePageMeta({ layout: 'admin', title: 'Lead 管理' });

const router = useRouter();
const { formatDateTime } = useFormat();
const { getLeadStatusLabel } = useAdminStatus();

// ── Table page composable ──────────────────────────────────────────────────

type LeadFilters = { status: string; startDate: string; endDate: string };
type DisplayLead = LeadVM & {
  statusLabel: string;
  createdAtDisplay: string;
  contactInfo: string;
  inquirySummary: string;
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
} = useAdminTablePage<LeadFilters, LeadListParams, LeadVM, DisplayLead>({
  pageSize: 20,
  filterQueryKeys: ['status', 'startDate', 'endDate'],
  buildParams: ctx => {
    const p: LeadListParams = { page: ctx.page, pageSize: ctx.pageSize };
    if (ctx.keyword) p.keyword = ctx.keyword;
    if (ctx.filters.status) p.status = ctx.filters.status as LeadStatus;
    if (ctx.filters.startDate) p.startDate = ctx.filters.startDate;
    if (ctx.filters.endDate) p.endDate = ctx.filters.endDate;
    if (ctx.sortBy) p.sortBy = ctx.sortBy;
    if (ctx.sortOrder) p.sortOrder = ctx.sortOrder;
    return p;
  },
  fetcher: listLeads,
  mapRows: raw =>
    raw.map(lead => ({
      ...lead,
      statusLabel: getLeadStatusLabel(lead.status ?? ''),
      createdAtDisplay: lead.submittedAt ? formatDateTime(lead.submittedAt) : '-',
      contactInfo: [lead.phone, lead.email].filter(Boolean).join(' / ') || '-',
      inquirySummary: lead.inquiry
        ? lead.inquiry.length > 40
          ? lead.inquiry.slice(0, 40) + '…'
          : lead.inquiry
        : '-',
    })),
});

onMounted(fetchData);

// ── Row click ──────────────────────────────────────────────────────────────

function onRowClick(row: { id: string }) {
  router.push(`/admin/leads/${row.id}`);
}

// ── Filter bar ─────────────────────────────────────────────────────────────

const filterDefs: FilterDef[] = [
  {
    key: 'keyword',
    label: '關鍵字',
    type: 'keyword',
    placeholder: '搜尋姓名 / 公司…',
  },
  {
    key: 'status',
    label: '狀態',
    type: 'select',
    options: [
      { label: '全部', value: 'all' },
      { label: '新增', value: 'new' },
      { label: '已聯繫', value: 'contacted' },
      { label: '已評估', value: 'qualified' },
      { label: '已關閉', value: 'closed' },
    ],
  },
  { key: 'dateRange', label: '時間範圍', type: 'date-range' },
];

// ── Table columns ──────────────────────────────────────────────────────────

const columns = [
  { accessorKey: 'name', header: '姓名', sortable: true },
  { accessorKey: 'company', header: '公司', sortable: true },
  { accessorKey: 'contactInfo', header: '聯絡方式' },
  { accessorKey: 'inquirySummary', header: '詢問品項' },
  { accessorKey: 'statusLabel', header: '狀態' },
  { accessorKey: 'createdAtDisplay', header: '建立時間', sortable: true },
];
</script>

<template>
  <div class="space-y-4">
    <AppPageHeader title="Lead 管理" />

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
      empty-text="目前沒有 Lead 資料"
      @update:page="onPageChange"
      @update:sort="onSort"
      @row-click="onRowClick"
    />
  </div>
</template>
