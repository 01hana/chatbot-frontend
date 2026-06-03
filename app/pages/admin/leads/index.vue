<script setup lang="ts">
import DtTable from './DtTable.vue';
import PageHeader from './PageHeader.vue';

provide(useModalKey, useModal());
provide(DtUtils.key, new DtUtils(useAdminLeads()));

definePageMeta({ layout: 'admin', title: 'Lead 管理' });
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
