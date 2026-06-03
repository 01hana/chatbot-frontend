<script setup lang="ts">
import AppPageHeader from '~/features/admin/components/AppPageHeader.vue';
import type { FilterDef } from '~/components/FilterBar.vue';

const filterDefs: FilterDef[] = [
  {
    key: 'keyword',
    label: '關鍵字',
    type: 'keyword',
    placeholder: '搜尋知識庫標題',
  },
  {
    key: 'dateRange',
    label: '時間範圍',
    type: 'date-range',
  },
];
</script>

<template>
  <TableFilterBar :filters="filterDefs">
    <template #header="{ FilterToggle }">
      <AppPageHeader title="知識庫管理" description="維護 AI 客服可引用的知識條目與分類。">
        <template #actions>
          <component :is="FilterToggle" />
        </template>
      </AppPageHeader>
    </template>
  </TableFilterBar>
</template>
