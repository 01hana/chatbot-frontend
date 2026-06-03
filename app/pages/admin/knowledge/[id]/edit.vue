<script setup lang="ts">
import AppEmptyState from '~/features/admin/components/AppEmptyState.vue';
import AppErrorState from '~/features/admin/components/AppErrorState.vue';
import KnowledgeEditorForm from '../components/KnowledgeEditorForm.vue';
import KnowledgeVersionHistory from '../components/KnowledgeVersionHistory.vue';
import type {
  KnowledgeCreatePayload,
  KnowledgeEntryVM,
  KnowledgeUpdatePayload,
} from '~/types/admin';

definePageMeta({ layout: 'admin', title: '編輯知識庫' });

const route = useRoute();
const router = useRouter();
const toast = useAppToast();
const knowledgeStore = useAdminKnowledge();

const id = computed(() => String(route.params.id));
const entry = ref<KnowledgeEntryVM | null>(null);
const loading = ref(true);
const saving = ref(false);
const error = ref('');
const versionOpen = ref(false);

async function loadEntry() {
  loading.value = true;
  error.value = '';

  try {
    entry.value = await knowledgeStore.get(id.value);
  } catch (e) {
    entry.value = null;
    error.value = e instanceof Error ? e.message : '載入知識庫失敗，請稍後再試';
  } finally {
    loading.value = false;
  }
}

async function onSubmit(payload: KnowledgeCreatePayload | KnowledgeUpdatePayload) {
  saving.value = true;

  try {
    await knowledgeStore.update(id.value, payload as KnowledgeUpdatePayload);
    toast.success('儲存成功');
    await loadEntry();
  } catch (e) {
    toast.error(e instanceof Error ? e.message : '儲存失敗，請稍後再試');
  } finally {
    saving.value = false;
  }
}

onMounted(loadEntry);
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <UButton
          icon="i-heroicons-arrow-left"
          variant="ghost"
          color="neutral"
          to="/admin/knowledge"
        >
          返回列表
        </UButton>

        <div>
          <h2 class="text-lg font-semibold text-gray-800">編輯知識庫</h2>
          <p class="mt-1 text-sm text-gray-500">更新知識內容，並可從版本歷史還原至先前版本。</p>
        </div>
      </div>

      <UButton
        icon="fluent:arrow-rotate-counterclockwise-24-regular"
        variant="outline"
        :disabled="!entry"
        @click="versionOpen = true"
      >
        版本歷史
      </UButton>
    </div>

    <AppErrorState v-if="error && !entry" :message="error" @retry="loadEntry" />

    <div v-else-if="loading && !entry" class="space-y-4">
      <div class="h-72 rounded-lg bg-gray-100 animate-pulse" />
    </div>

    <AppEmptyState v-else-if="!entry" title="找不到知識庫資料" />

    <UCard v-else>
      <KnowledgeEditorForm
        :model-value="entry"
        :loading="saving"
        submit-label="儲存"
        @submit="onSubmit"
        @cancel="router.push('/admin/knowledge')"
      />
    </UCard>

    <KnowledgeVersionHistory v-model:open="versionOpen" :entry-id="id" @restored="loadEntry" />
  </div>
</template>
