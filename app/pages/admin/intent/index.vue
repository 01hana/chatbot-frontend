<script setup lang="ts">
import DtHeader from './DtHeader.vue';
import DtTable from './DtTable.vue';
import PageHeader from './PageHeader.vue';

provide(useModalKey, useModal());

const intentStore = useAdminIntent();
const dt = new DtUtils(intentStore);

provide(DtUtils.key, dt);

definePageMeta({ layout: 'admin', title: '意圖 / 模板管理' });
</script>

<template>
  <div class="space-y-4">
    <PageHeader />
  </div>

  <UCard>
    <template #header>
      <DtHeader />
    </template>

    <DtTable />
  </UCard>
</template>
