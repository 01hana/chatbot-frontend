<script setup lang="ts">
import AppPageHeader from '~/features/admin/components/AppPageHeader.vue';
import type { FilterDef } from '~/components/FilterBar.vue';

const filterDefs: FilterDef[] = [
  {
    key: 'keyword',
    label: '關鍵字',
    type: 'keyword',
    placeholder: '搜尋意圖名稱或關鍵字',
  },
];
</script>

<template>
  <TableFilterBar :filters="filterDefs">
    <template #header="{ FilterToggle }">
      <AppPageHeader title="意圖 / 模板管理" description="維護 AI 客服的意圖分類、觸發關鍵字與回覆模板。">
        <template #actions>
          <component :is="FilterToggle" />
        </template>
      </AppPageHeader>
    </template>
  </TableFilterBar>
</template>
