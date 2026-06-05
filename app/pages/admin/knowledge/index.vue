<script setup lang="ts">
import DtHeader from './DtHeader.vue';
import DtTable from './DtTable.vue';
import KnowledgeImportModal from './components/KnowledgeImportModal.vue';
import PageHeader from './PageHeader.vue';

provide(useModalKey, useModal());

const knowledgeStore = useAdminKnowledge();
const dt = new DtUtils(knowledgeStore);
const [importOpen, setImportOpen] = useAppState(false);

provide(DtUtils.key, dt);

definePageMeta({ layout: 'admin', title: '知識庫管理' });

function refreshTable() {
  knowledgeStore.getTable(dt.params.value);
}

const importOpenModel = computed({
  get: () => importOpen.value,
  set: setImportOpen,
});
</script>

<template>
  <div class="space-y-4">
    <PageHeader />
  </div>

  <UCard>
    <template #header>
      <DtHeader @open-import="setImportOpen(true)" />
    </template>

    <DtTable />
  </UCard>

  <KnowledgeImportModal
    v-model:open="importOpenModel"
    @imported="refreshTable"
  />
</template>
