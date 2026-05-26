<script setup lang="ts">
/**
 * /admin/conversations — 對話紀錄列表 (T-053, Phase 3 refactor)
 *
 * Uses useAdminTablePage to centralise page/sort/filter/URL/data state.
 */

import type { FilterDef } from '~/features/admin/components/AdminFilterBar.vue';
import AppPageHeader from '~/features/admin/components/AppPageHeader.vue';
import AdminFilterBar from '~/features/admin/components/AdminFilterBar.vue';
import AppErrorState from '~/features/admin/components/AppErrorState.vue';
import DtTable from './DtTable.vue';

provide(useModalKey, useModal());
provide(DtUtils.key, new DtUtils(useAdminConversations()));

definePageMeta({ layout: 'admin', title: '對話紀錄' });

// ── Export ─────────────────────────────────────────────────────────────────

// const exporting = ref(false);

// async function handleExport() {
//   exporting.value = true;
//   try {
//     const { url } = await exportConversations(buildCurrentParams());
//     downloadUrl(url, buildTimestampedFilename('conversations', 'csv'));
//     toast.success('匯出成功');
//   } catch (e) {
//     toast.error(e instanceof Error ? e.message : '匯出失敗，請稍後再試');
//   } finally {
//     exporting.value = false;
//   }
// }

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
</script>

<template>
  <div class="space-y-4">
    <AppPageHeader title="對話紀錄">
      <template #actions>
        <UButton icon="i-heroicons-arrow-down-tray" variant="outline" color="neutral" size="sm">
          匯出 CSV
        </UButton>
      </template>
    </AppPageHeader>

    <!-- Filter bar -->
    <!-- <AdminFilterBar
      :filters="filterDefs"
      :model-value="filterValues"
      @update:filters="onFiltersUpdate"
    /> -->

    <!-- Error state -->
    <!-- <AppErrorState v-if="error" :message="error" @retry="fetchData" /> -->
  </div>

  <UCard>
    <template #header> </template>

    <DtTable />
  </UCard>
</template>
