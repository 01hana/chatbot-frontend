<script setup lang="ts">
/**
 * /admin/conversations — 對話紀錄列表 (T-053, Phase 3 refactor)
 *
 * Uses TableData/DtUtils to centralise page/sort/filter/URL/data state.
 */

import DtTable from './DtTable.vue';
import PageHeader from './PageHeader.vue';

provide(useModalKey, useModal());
provide(DtUtils.key, new DtUtils(useAdminConversations()));

definePageMeta({ layout: 'admin', title: '對話紀錄' });
</script>

<template>
  <div class="space-y-4">
    <PageHeader />
  </div>

  <UCard>
    <template #header> </template>

    <DtTable />
  </UCard>
</template>
