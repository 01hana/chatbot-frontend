<script setup lang="ts">
import KnowledgeEditorForm from './components/KnowledgeEditorForm.vue';
import type { KnowledgeCreatePayload, KnowledgeUpdatePayload } from '~/types/admin';

definePageMeta({ layout: 'admin', title: '新增知識庫' });

const router = useRouter();
const toast = useAppToast();
const knowledgeStore = useAdminKnowledge();
const [saving, setSaving] = useAppState(false);

async function onSubmit(payload: KnowledgeCreatePayload | KnowledgeUpdatePayload) {
  setSaving(true);

  try {
    await knowledgeStore.create(payload as KnowledgeCreatePayload);
    toast.success('新增成功');
    await router.push('/admin/knowledge');
  } catch (error) {
    toast.error(error instanceof Error ? error.message : '新增失敗，請稍後再試');
  } finally {
    setSaving(false);
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold text-gray-800">新增知識庫</h2>
        <p class="mt-1 text-sm text-gray-500">建立 AI 客服可引用的知識內容。</p>
      </div>

      <UButton icon="i-heroicons-arrow-left" variant="ghost" color="neutral" to="/admin/knowledge">
        返回列表
      </UButton>
    </div>

    <UCard>
      <KnowledgeEditorForm
        submit-label="建立"
        :loading="saving"
        @submit="onSubmit"
        @cancel="router.push('/admin/knowledge')"
      />
    </UCard>
  </div>
</template>
