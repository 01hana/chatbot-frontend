<script setup lang="ts">
import AppPageHeader from '~/features/admin/components/AppPageHeader.vue';
import type { FilterDef } from '~/components/FilterBar.vue';

const filterDefs: FilterDef[] = [
  {
    key: 'keyword',
    label: '關鍵字',
    type: 'keyword',
    placeholder: '搜尋姓名 / 公司',
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
      <AppPageHeader title="Lead 管理" description="檢視訪客提交的聯絡資料與需求內容。">
        <template #actions>
          <component :is="FilterToggle" />
        </template>
      </AppPageHeader>
    </template>
  </TableFilterBar>
</template>
