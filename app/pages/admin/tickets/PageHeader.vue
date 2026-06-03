<script setup lang="ts">
import AppPageHeader from '~/features/admin/components/AppPageHeader.vue';
import type { FilterDef } from '~/components/FilterBar.vue';

const filterDefs: FilterDef[] = [
  {
    key: 'keyword',
    label: '關鍵字',
    type: 'keyword',
    placeholder: '搜尋 Ticket',
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
      <AppPageHeader title="Ticket 管理" description="追蹤轉人工與後續處理狀態。">
        <template #actions>
          <component :is="FilterToggle" />
        </template>
      </AppPageHeader>
    </template>
  </TableFilterBar>
</template>
