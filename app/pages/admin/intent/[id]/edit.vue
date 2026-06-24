<script setup lang="ts">
import AppEmptyState from '~/features/admin/components/AppEmptyState.vue';
import AppErrorState from '~/features/admin/components/AppErrorState.vue';
import IntentEditorForm from '../components/IntentEditorForm.vue';
import type { IntentCreatePayload, IntentSummaryVM, IntentUpdatePayload } from '~/types/admin';

definePageMeta({ layout: 'admin', title: '編輯意圖' });

const route = useRoute();
const router = useRouter();
const toast = useAppToast();
const { get, update } = useAdminIntent();
const [loading, setLoading] = useAppState(true);
const [saving, setSaving] = useAppState(false);

const intent = ref<IntentSummaryVM | null>(null);
const error = ref('');

const id = computed(() => String(route.params.id));

onMounted(loadIntent);

async function loadIntent() {
  setLoading(true);
  error.value = '';

  try {
    intent.value = await get(id.value);

    console.log(    intent.value);
  } catch (e) {
    intent.value = null;
    error.value = e instanceof Error ? e.message : '載入意圖失敗，請稍後再試';
  } finally {
    setLoading(false);
  }
}

async function onSubmit(payload: IntentCreatePayload | IntentUpdatePayload) {
  setSaving(true);

  await update(id.value, payload as IntentUpdatePayload);
  toast.success('意圖已更新');

  await loadIntent();
  setSaving(false);
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold text-gray-800">編輯意圖</h2>
        <p class="mt-1 text-sm text-gray-500">更新意圖分類、觸發關鍵字與回覆模板。</p>
      </div>

      <UButton icon="i-heroicons-arrow-left" variant="ghost" color="neutral" to="/admin/intent">
        返回列表
      </UButton>
    </div>

    <AppErrorState v-if="error && !intent" :message="error" @retry="loadIntent" />

    <div v-else-if="loading && !intent" class="space-y-4">
      <div class="h-80 rounded-lg bg-gray-100 animate-pulse" />
    </div>

    <AppEmptyState v-else-if="!intent" title="找不到意圖資料" />

    <UCard v-else>
      <IntentEditorForm
        :model-value="intent"
        submit-label="儲存"
        :loading="saving"
        @submit="onSubmit"
        @cancel="router.push('/admin/intent')"
      />
    </UCard>
  </div>
</template>
