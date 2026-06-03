<script setup lang="ts">
import AppPageHeader from '~/features/admin/components/AppPageHeader.vue';
import type { FilterDef } from '~/components/FilterBar.vue';

const { params } = inject(DtUtils.key) as InstanceType<typeof DtUtils>;

const { exportCsv } = useAdminConversations();
const { downloadUrl, buildTimestampedFilename } = useAdminDownload();
const toast = useAppToast();
const [exporting, setExporting] = useAppState(false);

async function handleExport() {
  setExporting(true);

  try {
    const { url } = await exportCsv(params.value);
    downloadUrl(url, buildTimestampedFilename('conversations', 'csv'));
    toast.success('匯出成功');
  } catch (e) {
    toast.error(e instanceof Error ? e.message : '匯出失敗，請稍後再試');
  } finally {
    setExporting(false);
  }
}

const filterDefs: FilterDef[] = [
  {
    key: 'keyword',
    label: '關鍵字',
    type: 'keyword',
    placeholder: '搜尋 Session ID',
  },
  {
    key: 'dateRange',
    label: '時間範圍',
    type: 'date-range',
  },
];
</script>

<template>
  <TableFilterBar :filters="filterDefs" :search-keys="['sessionId']">
    <template #header="{ FilterToggle }">
      <AppPageHeader title="對話紀錄">
        <template #actions>
          <UButton
            icon="i-heroicons-arrow-down-tray"
            variant="subtle"
            :loading="exporting"
            @click="handleExport"
            class="bg-sky-50 text-sky-600 shadow-xs transition-all duration-200 hover:border-sky-300 hover:bg-sky-100 hover:text-sky-700 hover:shadow-md active:scale-95"
          >
            匯出 CSV
          </UButton>

          <component :is="FilterToggle" />
        </template>
      </AppPageHeader>
    </template>
  </TableFilterBar>
</template>
