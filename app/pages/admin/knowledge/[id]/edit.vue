<script setup lang="ts">
import AppEmptyState from '~/features/admin/components/AppEmptyState.vue';
import AppErrorState from '~/features/admin/components/AppErrorState.vue';
import AppStatusBadge from '~/features/admin/components/AppStatusBadge.vue';
import KnowledgeEditorForm from '../components/KnowledgeEditorForm.vue';
import KnowledgeVersionHistory from '../components/KnowledgeVersionHistory.vue';
import type {
  KnowledgeEntryVM,
  KnowledgeUpdatePayload,
  KnowledgeVisibilityUpdateValue,
} from '~/types/admin';

type VisibilityFormValues = {
  isPublicVisible: boolean;
};

definePageMeta({ layout: 'admin', title: '編輯知識庫' });

const route = useRoute();
const router = useRouter();
const toast = useAppToast();
const { get, update, publish, archive, updateVisibility } = useAdminKnowledge();

const [loading, setLoading] = useAppState(true);
const [saving, setSaving] = useAppState(false);
const [statusSaving, setStatusSaving] = useAppState(false);
const [isUpdatingVisibility, setUpdatingVisibility] = useAppState(false);
const [suppressVisibilityWatch, setSuppressVisibilityWatch] = useAppState(false);

const id = computed(() => String(route.params.id));
const entry = ref<KnowledgeEntryVM | null>(null);
const error = ref('');
const [versionOpen, setVersionOpen] = useAppState(false);
const retrievalBlockReasonLabels: Record<string, string> = {
  status_not_published: '尚未發佈',
  visibility_not_public: '未公開給前台 AI',
  deleted: '資料已刪除',
  intentLabel_missing: '缺少 AI 意圖分類',
  tags_empty: '缺少檢索標籤',
  content_empty: '缺少可檢索內容',
};
const visibilityUpdateFields = ['isPublicVisible'];
const { resetForm: resetVisibilityForm, setFieldValue: setVisibilityFieldValue, values: visibilityValues } = useForm<VisibilityFormValues>({
  initialValues: {
    isPublicVisible: false,
  },
});
const { formUpdate: updateVisibilityForm } = useAppForm(
  visibilityUpdateFields,
  setVisibilityFieldValue,
);

const versionOpenModel = computed({
  get: () => versionOpen.value,
  set: setVersionOpen,
});
const retrievalBlockReasonItems = computed(() =>
  (entry.value?.retrievalBlockReasons ?? []).map(
    reason => retrievalBlockReasonLabels[reason] ?? reason,
  ),
);
const hasRetrievableState = computed(() =>
  entry.value?.retrievable !== undefined || retrievalBlockReasonItems.value.length > 0,
);

onMounted(loadEntry);

watch(
  () => visibilityValues.isPublicVisible,
  async (next, previous) => {
    if (suppressVisibilityWatch.value || loading.value || !entry.value) return;

    const nextValue = Boolean(next);
    const previousValue = Boolean(previous);
    const nextVisibility: KnowledgeVisibilityUpdateValue = nextValue ? 'public' : 'private';

    setUpdatingVisibility(true);

    try {
      const updated = await updateVisibility(id.value, nextVisibility);
      entry.value = {
        ...entry.value,
        ...updated,
      };
      await syncVisibilityState(entry.value);
      toast.success('前台 AI 可見性已更新');
    } catch {
      await rollbackVisibilityState(previousValue);
    } finally {
      setUpdatingVisibility(false);
    }
  },
);

async function loadEntry() {
  setLoading(true);
  error.value = '';

  try {
    const data = await get(id.value);
    entry.value = data;
    await syncVisibilityState(data);
  } catch (e) {
    entry.value = null;
    error.value = e instanceof Error ? e.message : '載入知識庫失敗，請稍後再試';
  } finally {
    setLoading(false);
  }
}

async function syncVisibilityState(data: KnowledgeEntryVM) {
  setSuppressVisibilityWatch(true);
  resetVisibilityForm({ values: { isPublicVisible: false } });
  updateVisibilityForm({ isPublicVisible: data.visibility === 'public' });
  await nextTick();
  setSuppressVisibilityWatch(false);
}

async function rollbackVisibilityState(previousValue: boolean) {
  setSuppressVisibilityWatch(true);
  setVisibilityFieldValue('isPublicVisible', previousValue);
  await nextTick();
  setSuppressVisibilityWatch(false);
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
        <template #header>
          <div class="space-y-1">
            <p class="text-sm font-medium text-gray-700">前台 AI 可見性</p>
            <p class="text-sm text-gray-500">
              開啟後，當狀態為已發佈且資料完整時，前台 AI 才能檢索這筆知識。
            </p>
          </div>
        </template>

        <UForm id="knowledge-visibility-form" :state="{}" class="space-y-4">
          <FormField
            name="isPublicVisible"
            label="公開給前台 AI 使用"
            fieldType="switch"
            :disabled="isUpdatingVisibility"
          />

          <p class="text-xs leading-relaxed text-gray-500">
            關閉時此知識僅供後台管理使用，不會被前台聊天機器人引用。
          </p>

          <div
            v-if="hasRetrievableState"
            class="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
          >
            <p :class="entry.retrievable ? 'text-green-700' : 'text-gray-600'">
              {{ entry.retrievable ? '目前可被前台 AI 檢索' : '目前尚不可被前台 AI 檢索' }}
            </p>

            <div v-if="retrievalBlockReasonItems.length" class="mt-2 flex flex-wrap gap-2">
              <UBadge
                v-for="reason in retrievalBlockReasonItems"
                :key="reason"
                variant="soft"
                color="neutral"
              >
                {{ reason }}
              </UBadge>
            </div>
          </div>
        </UForm>
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
