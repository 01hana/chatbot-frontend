<script setup lang="ts">
import IntentEditorForm from './components/IntentEditorForm.vue';
import type { IntentCreatePayload, IntentUpdatePayload } from '~/types/admin';

definePageMeta({ layout: 'admin', title: '新增意圖' });

const router = useRouter();
const toast = useAppToast();
const intentStore = useAdminIntent();
const [saving, setSaving] = useAppState(false);

async function onSubmit(payload: IntentCreatePayload | IntentUpdatePayload) {
  setSaving(true);

  try {
    await intentStore.create(payload as IntentCreatePayload);
    toast.success('意圖已建立');
    await router.push('/admin/intent');
  } finally {
    setSaving(false);
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold text-gray-800">新增意圖</h2>
        <p class="mt-1 text-sm text-gray-500">建立 AI 客服的意圖分類、觸發關鍵字與回覆模板。</p>
      </div>

      <UButton icon="i-heroicons-arrow-left" variant="ghost" color="neutral" to="/admin/intent">
        返回列表
      </UButton>
    </div>

    <UCard>
      <IntentEditorForm
        submit-label="建立"
        :loading="saving"
        @submit="onSubmit"
        @cancel="router.push('/admin/intent')"
      />
    </UCard>
  </div>
</template>
