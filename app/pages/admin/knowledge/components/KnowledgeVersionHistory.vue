<script setup lang="ts">
import type { KnowledgeRevisionVM } from '~/types/admin';

const props = defineProps<{
  open: boolean;
  entryId: string;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  restored: [];
}>();

const toast = useAppToast();
const { formatDateTime } = useFormat();
const knowledgeStore = useAdminKnowledge();

const revisions = ref<KnowledgeRevisionVM[]>([]);
const loading = ref(false);
const restoring = ref(false);
const error = ref('');
const expandedId = ref<string | null>(null);
const confirmOpen = ref(false);
const selectedRevision = ref<KnowledgeRevisionVM | null>(null);

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
});

watch(
  () => props.open,
  open => {
    if (open) loadRevisions();
  },
);

async function loadRevisions() {
  loading.value = true;
  error.value = '';

  try {
    revisions.value = await knowledgeStore.getVersionHistory(props.entryId);
  } catch (e) {
    revisions.value = [];
    error.value = e instanceof Error ? e.message : '載入版本歷史失敗，請稍後再試';
  } finally {
    loading.value = false;
  }
}

function toggleRevision(revision: KnowledgeRevisionVM) {
  expandedId.value = expandedId.value === revision.revisionId ? null : revision.revisionId;
}

function openRestoreConfirm(revision: KnowledgeRevisionVM) {
  selectedRevision.value = revision;
  confirmOpen.value = true;
}

async function restoreSelectedRevision() {
  if (!selectedRevision.value) return;

  restoring.value = true;

  try {
    await knowledgeStore.restoreVersion(props.entryId, selectedRevision.value.revisionId);
    toast.success('還原成功');
    confirmOpen.value = false;
    isOpen.value = false;
    emit('restored');
  } catch (e) {
    toast.error(e instanceof Error ? e.message : '還原失敗，請稍後再試');
  } finally {
    restoring.value = false;
  }
}
</script>

<template>
  <USlideover v-model:open="isOpen" title="版本歷史">
    <template #body>
      <div class="space-y-4">
        <AppErrorState v-if="error" :message="error" @retry="loadRevisions" />

        <div v-else-if="loading" class="space-y-3">
          <div v-for="i in 4" :key="i" class="h-20 rounded bg-gray-100 animate-pulse" />
        </div>

        <AppEmptyState v-else-if="!revisions.length" title="尚無版本歷史" />

        <div v-else class="space-y-3">
          <div
            v-for="revision in revisions"
            :key="revision.revisionId"
            class="rounded-lg border border-gray-200 p-4"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <button
                type="button"
                class="min-w-0 text-left"
                @click="toggleRevision(revision)"
              >
                <p class="text-sm font-semibold text-gray-800">
                  版本 {{ revision.revisionNumber }}
                </p>
                <p class="mt-1 text-xs text-gray-500">
                  {{ formatDateTime(revision.updatedAt) }} · 修改者：系統
                </p>
                <p v-if="revision.note" class="mt-1 text-xs text-gray-500">
                  {{ revision.note }}
                </p>
              </button>

              <UButton
                size="xs"
                variant="outline"
                color="warning"
                :loading="restoring && selectedRevision?.revisionId === revision.revisionId"
                @click="openRestoreConfirm(revision)"
              >
                還原至此版本
              </UButton>
            </div>

            <div
              v-if="expandedId === revision.revisionId"
              class="mt-4 rounded bg-gray-50 p-3 text-sm text-gray-700"
            >
              <p class="mb-2 text-xs font-medium text-gray-500">差異 / 內容摘要</p>
              <pre class="whitespace-pre-wrap font-sans">{{ revision.diff || revision.content || '無差異內容' }}</pre>
            </div>
          </div>
        </div>
      </div>
    </template>
  </USlideover>

  <AlertModal
    v-model:open="confirmOpen"
    title="確認還原版本"
    type="warning"
    icon="i-heroicons-arrow-uturn-left"
    @callAction="restoreSelectedRevision"
  >
    <template #content>
      <p class="text-center text-sm text-gray-600">
        確定要還原至版本 {{ selectedRevision?.revisionNumber }} 嗎？目前內容將被版本內容覆蓋。
      </p>
    </template>
  </AlertModal>
</template>
