<script setup lang="ts">
import DtHeader from './DtHeader.vue';
import DtTable from './DtTable.vue';
import KnowledgeImportModal from './components/KnowledgeImportModal.vue';
import PageHeader from './PageHeader.vue';

provide(useModalKey, useModal());

const knowledgeStore = useAdminKnowledge();
const dt = new DtUtils(knowledgeStore);
const importOpen = ref(false);

provide(DtUtils.key, dt);

definePageMeta({ layout: 'admin', title: '知識庫管理' });

function refreshTable() {
  knowledgeStore.getTable(dt.params.value);
}
</script>

<template>
  <div class="space-y-4">
    <PageHeader />
  </div>

  <UCard>
    <template #header>
      <DtHeader @open-import="importOpen = true" />
    </template>

    <DtTable />
  </UCard>

  <KnowledgeImportModal
    v-model:open="importOpen"
    @imported="refreshTable"
  />
</template>
