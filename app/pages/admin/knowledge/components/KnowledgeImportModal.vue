<script setup lang="ts">
import type { KnowledgeImportResult } from '~/types/admin';

type ImportFormValues = {
  file: File | File[] | null;
};

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  imported: [];
}>();

const toast = useAppToast();
const knowledgeStore = useAdminKnowledge();

const loading = ref(false);
const result = ref<KnowledgeImportResult | null>(null);
const error = ref('');
const { handleSubmit, resetForm } = useForm<ImportFormValues>({
  validationSchema: {
    file: 'required',
  },
});

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
});

const csvTemplateHref = computed(() =>
  `data:text/csv;charset=utf-8,${encodeURIComponent('title,category,status,content\n範例標題,使用教學,published,範例內容')}`,
);
const jsonTemplateHref = computed(() =>
  `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(
    [
      {
        title: '範例標題',
        category: '使用教學',
        status: 'published',
        content: '範例內容',
      },
    ],
    null,
    2,
  ))}`,
);

watch(
  () => props.open,
  open => {
    if (!open) resetState();
  },
);

function resetState() {
  resetForm();
  loading.value = false;
  result.value = null;
  error.value = '';
}

function resolveFile(fileValue: ImportFormValues['file']) {
  if (Array.isArray(fileValue)) return fileValue[0] ?? null;
  return fileValue ?? null;
}

const onSubmit = handleSubmit(async values => {
  const file = resolveFile(values.file);

  if (!file) return;

  if (!/\.(csv|json)$/i.test(file.name)) {
    error.value = '僅支援 CSV 或 JSON 檔案';
    toast.error(error.value);
    return;
  }

  const formData = new FormData();
  formData.append('file', file);
  loading.value = true;
  error.value = '';

  try {
    result.value = await knowledgeStore.importKnowledge(formData);
    toast.success('匯入完成');
    emit('imported');
  } catch (e) {
    error.value = e instanceof Error ? e.message : '匯入失敗，請稍後再試';
    toast.error(error.value);
  } finally {
    loading.value = false;
  }
}) as (e?: Event) => Promise<void>;
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="批次匯入知識庫"
    class="max-w-screen w-2xl"
    @after:leave="resetState"
  >
    <template #body>
      <UForm
        id="knowledge-import-form"
        :state="{}"
        class="space-y-5"
        enctype="multipart/form-data"
        @submit="onSubmit"
      >
        <div class="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
          <p class="font-medium text-gray-800">支援格式</p>
          <p class="mt-1">CSV / JSON。欄位請包含 title、category、status、content。</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <UButton
              size="xs"
              variant="outline"
              icon="i-heroicons-arrow-down-tray"
              :href="csvTemplateHref"
              download="knowledge-template.csv"
            >
              CSV 範本
            </UButton>
            <UButton
              size="xs"
              variant="outline"
              icon="i-heroicons-arrow-down-tray"
              :href="jsonTemplateHref"
              download="knowledge-template.json"
            >
              JSON 範本
            </UButton>
          </div>
        </div>

        <FileUpload
          label="匯入檔案"
          name="file"
          description="支援 CSV / JSON"
          accept=".csv,.json"
          :disabled="loading"
        />

        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          icon="i-heroicons-exclamation-triangle"
          :description="error"
        />

        <div v-if="result" class="rounded-lg border border-gray-200 p-4">
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <p class="text-xs text-gray-500">成功筆數</p>
              <p class="text-2xl font-semibold text-emerald-600">{{ result.success }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500">失敗筆數</p>
              <p class="text-2xl font-semibold text-red-500">{{ result.failed }}</p>
            </div>
          </div>

          <div v-if="result.errors?.length" class="mt-4">
            <p class="text-sm font-medium text-gray-800">失敗原因</p>
            <ul class="mt-2 space-y-1 text-sm text-gray-600">
              <li v-for="item in result.errors" :key="`${item.row ?? 'unknown'}-${item.message}`">
                <span v-if="item.row">第 {{ item.row }} 列：</span>{{ item.message }}
              </li>
            </ul>
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <UButton
            type="button"
            variant="outline"
            color="neutral"
            :disabled="loading"
            @click="isOpen = false"
          >
            取消
          </UButton>
          <UButton type="submit" icon="i-heroicons-arrow-up-tray" :loading="loading">
            開始匯入
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
