<script setup lang="ts">
import WidgetPreviewPanel from './components/WidgetPreviewPanel.vue';
import WidgetSettingsForm from './components/WidgetSettingsForm.vue';
import AppPageHeader from '~/features/admin/components/AppPageHeader.vue';
import type { WidgetSettingsVM } from '~/types/admin';

definePageMeta({ layout: 'admin', title: 'Widget 設定' });

const { get, update } = useAdminWidgetSettings();
const { loading, saving } = storeToRefs(useAdminWidgetSettings());
const toast = useAppToast();
const draft = ref<WidgetSettingsVM | null>(null);

onMounted(loadSettings);

async function loadSettings() {
  draft.value = await get();

  console.log( draft.value);
}

async function saveSettings(payload: WidgetSettingsVM) {
  draft.value = await update(payload);

  toast.success('Widget 設定已儲存');
}
</script>

<template>
  <div class="space-y-6">
    <AppPageHeader
      title="Widget 設定"
      description="設定前台 Widget 文案、服務狀態與快捷提問預覽。"
    />

    <div v-if="loading && !draft" class="grid gap-4 lg:grid-cols-2">
      <div class="h-96 rounded bg-gray-100 animate-pulse" />
      <div class="h-96 rounded bg-gray-100 animate-pulse" />
    </div>

    <div v-else>
      <WidgetSettingsForm v-model="draft" :loading="saving" @submit="saveSettings" />
      <!-- <WidgetPreviewPanel :settings="draft" /> -->
    </div>
  </div>
</template>
