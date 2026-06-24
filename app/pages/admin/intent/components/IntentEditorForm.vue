<script setup lang="ts">
import type {
  IntentCreatePayload,
  IntentPreviewResult,
  IntentSummaryVM,
  IntentUpdatePayload,
} from '~/types/admin';

type IntentFormValues = {
  name: string;
  priority: number;
  responseTemplate: string;
};

const props = withDefaults(
  defineProps<{
    modelValue?: IntentSummaryVM | null;
    loading?: boolean;
    submitLabel?: string;
  }>(),
  {
    modelValue: null,
    loading: false,
    submitLabel: '儲存',
  },
);

const emit = defineEmits<{
  submit: [payload: IntentCreatePayload | IntentUpdatePayload];
  cancel: [];
}>();

const intentStore = useAdminIntent();
const [previewing, setPreviewing] = useAppState(false);

const keywords = ref<string[]>([]);
const keywordInput = ref('');
const testInput = ref('');
const previewResult = ref<IntentPreviewResult | null>(null);

const priorityItems = [
  { label: '1', value: 10 },
  { label: '2', value: 20 },
  { label: '3', value: 30 },
  { label: '4', value: 40 },
  { label: '5', value: 50 },
];

const updateFields = ['title', 'priority', 'responseTemplate', 'keywords'];
const { handleSubmit, resetForm, setFieldValue } = useForm<IntentFormValues>({
  validationSchema: {
    title: 'required',
  },
});

const { formUpdate } = useAppForm(updateFields, setFieldValue);

const previewTemplate = computed(
  () =>
    previewResult.value?.responseTemplate ??
    previewResult.value?.template ??
    previewResult.value?.answer ??
    previewResult.value?.intent?.responseTemplate ??
    '',
);

watch(
  () => props.modelValue,
  value => {
    console.log('value', value);
    if (!value) {
      resetForm();
      return;
    }

    keywords.value = value.keywords;

    formUpdate(value);
  },
  { immediate: true, deep: true },
);

function addKeyword() {
  const keyword = keywordInput.value.trim();
  if (!keyword || keywords.value.includes(keyword)) return;

  keywords.value.push(keyword);
  keywordInput.value = '';
}

function removeKeyword(keyword: string) {
  keywords.value = keywords.value.filter(item => item !== keyword);
}

function buildPayload(values: IntentFormValues): IntentCreatePayload | IntentUpdatePayload {
  const priority = Number(values.priority) || 1;

  return {
    name: values.name.trim(),
    keywords: keywords.value,
    examples: keywords.value,
    priority,
    sortOrder: priority,
    responseTemplate: values.responseTemplate,
    enabled: props.modelValue?.enabled ?? true,
    status: props.modelValue?.status ?? 'active',
  };
}

const onSubmit = handleSubmit(values => {
  emit('submit', buildPayload(values));
}) as (e?: Event) => Promise<void>;

async function previewIntent() {
  if (!testInput.value.trim()) return;

  setPreviewing(true);

  try {
    previewResult.value = await intentStore.previewIntent(testInput.value.trim());
  } finally {
    setPreviewing(false);
  }
}
</script>

<template>
  <UForm id="intent-editor-form" :state="{}" class="space-y-5" @submit="onSubmit">
    <FormField
      name="title"
      label="意圖名稱"
      placeholder="輸入意圖名稱"
      is-required
      :disabled="loading"
    />

    <div class="space-y-2">
      <label class="block text-sm text-gray-500">觸發關鍵字</label>
      <div class="flex gap-2">
        <UInput
          v-model="keywordInput"
          placeholder="輸入後按 Enter 新增"
          class="flex-1"
          :disabled="loading"
          @keydown.enter.prevent="addKeyword"
        />
        <UButton type="button" variant="outline" :disabled="loading" @click="addKeyword">
          新增
        </UButton>
      </div>
      <div class="flex flex-wrap gap-1">
        <UBadge v-for="keyword in keywords" :key="keyword" variant="soft" color="neutral">
          {{ keyword }}
          <button
            type="button"
            class="ml-1 text-gray-400"
            :disabled="loading"
            @click="removeKeyword(keyword)"
          >
            ×
          </button>
        </UBadge>
        <span v-if="!keywords.length" class="text-xs text-gray-400">尚未設定關鍵字</span>
      </div>
    </div>

    <FormField
      name="priority"
      label="優先級"
      fieldType="select"
      :items="priorityItems"
      :disabled="loading"
    />

    <FormField
      name="responseTemplate"
      label="回覆模板內容"
      fieldType="textarea"
      :rows="8"
      placeholder="輸入此意圖對應的回覆模板"
      :disabled="loading"
    />

    <div class="rounded-lg border border-gray-200 p-4 space-y-3">
      <p class="text-sm font-medium text-gray-700">測試預覽</p>
      <UTextarea v-model="testInput" :rows="3" placeholder="輸入測試問句" :disabled="loading" />
      <div class="flex justify-end">
        <UButton
          type="button"
          variant="outline"
          :loading="previewing"
          :disabled="loading || !testInput.trim()"
          @click="previewIntent"
        >
          預覽
        </UButton>
      </div>
      <UAlert
        v-if="previewResult"
        color="primary"
        variant="soft"
        :title="previewResult.matched ? '匹配成功' : '未匹配'"
        :description="previewTemplate || '尚無預覽內容'"
      />
    </div>

    <div class="flex justify-end gap-2">
      <UButton
        type="button"
        variant="outline"
        color="neutral"
        :disabled="loading"
        @click="emit('cancel')"
      >
        取消
      </UButton>
      <UButton type="submit" :loading="loading">
        {{ submitLabel }}
      </UButton>
    </div>
  </UForm>
</template>
