<script setup lang="ts">
import AppEmptyState from '~/features/admin/components/AppEmptyState.vue';
import AppErrorState from '~/features/admin/components/AppErrorState.vue';
import AppStatusBadge from '~/features/admin/components/AppStatusBadge.vue';
import KnowledgeEditorForm from '../components/KnowledgeEditorForm.vue';
import KnowledgeVersionHistory from '../components/KnowledgeVersionHistory.vue';
import type { KnowledgeEntryVM, KnowledgeUpdatePayload } from '~/types/admin';

definePageMeta({ layout: 'admin', title: '編輯知識庫' });

const route = useRoute();
const router = useRouter();
const toast = useAppToast();
const { get, update, publish, archive } = useAdminKnowledge();

const [loading, setLoading] = useAppState(true);
const [saving, setSaving] = useAppState(false);
const [statusSaving, setStatusSaving] = useAppState(false);

const id = computed(() => String(route.params.id));
const entry = ref<KnowledgeEntryVM | null>(null);
const error = ref('');
const [versionOpen, setVersionOpen] = useAppState(false);

const versionOpenModel = computed({
  get: () => versionOpen.value,
  set: setVersionOpen,
});

onMounted(loadEntry);

async function loadEntry() {
  setLoading(true);
  error.value = '';

  try {
    entry.value = await get(id.value);
  } catch (e) {
    entry.value = null;
    error.value = e instanceof Error ? e.message : '載入知識庫失敗，請稍後再試';
  } finally {
    setLoading(false);
  }
}

async function onSubmit(payload: KnowledgeUpdatePayload) {
  setSaving(true);

  try {
    await update(id.value, payload);
    toast.success('儲存成功');

    await loadEntry();
  } finally {
    setSaving(false);
  }
}

async function updateStatus(action: 'publish' | 'archive') {
  setStatusSaving(true);

  try {
    if (action === 'publish') {
      await publish(id.value);
      toast.success('狀態已更新為已核准');
    } else {
      await archive(id.value);
      toast.success('狀態已更新為已封存');
    }

    await loadEntry();
  } finally {
    setStatusSaving(false);
  }
}
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
        @click="setVersionOpen(true)"
      >
        版本歷史
      </UButton>
    </div>

    <AppErrorState v-if="error && !entry" :message="error" @retry="loadEntry" />

    <div v-else-if="loading && !entry" class="space-y-4">
      <div class="h-72 rounded-lg bg-gray-100 animate-pulse" />
    </div>

    <AppEmptyState v-else-if="!entry" title="找不到知識庫資料" />

    <template v-else>
      <UCard>
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-4">
              <p class="text-sm font-medium text-gray-700">狀態</p>
              <AppStatusBadge :status="entry.status" />
            </div>

            <div class="flex flex-wrap justify-end gap-2">
              <UButton
                icon="i-heroicons-check-circle"
                :loading="statusSaving"
                :disabled="entry.status === 'published' || statusSaving"
                @click="updateStatus('publish')"
              >
                核准 / 發佈
              </UButton>

              <UButton
                icon="i-heroicons-archive-box"
                variant="outline"
                color="neutral"
                :loading="statusSaving"
                :disabled="entry.status === 'archived' || statusSaving"
                @click="updateStatus('archive')"
              >
                封存
              </UButton>
            </div>
          </div>
        </template>
      </UCard>

      <UCard>
        <KnowledgeEditorForm
          :model-value="entry"
          :loading="saving"
          submit-label="儲存"
          @submit="onSubmit"
          @cancel="router.push('/admin/knowledge')"
        />
      </UCard>
    </template>

    <KnowledgeVersionHistory v-model:open="versionOpenModel" :entry-id="id" @restored="loadEntry" />
  </div>
</template>
