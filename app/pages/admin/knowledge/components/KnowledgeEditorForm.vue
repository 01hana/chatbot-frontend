<script setup lang="ts">
import type { KnowledgeStatus } from '~/types/admin';

type KnowledgeFormValues = {
  title: string;
  category: string;
  status: KnowledgeStatus;
  content: string;
};

const props = withDefaults(
  defineProps<{
    modelValue?: Partial<KnowledgeFormValues> | null;
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
  submit: [values: KnowledgeFormValues];
  cancel: [];
}>();

const defaultValues: KnowledgeFormValues = {
  title: '',
  category: '',
  status: 'draft',
  content: '',
};

const categoryOptions = [
  { label: '產品規格', value: '產品規格' },
  { label: '使用教學', value: '使用教學' },
  { label: '故障排除', value: '故障排除' },
  { label: '訂購流程', value: '訂購流程' },
  { label: '其他', value: '其他' },
];

const statusOptions: { label: string; value: KnowledgeStatus }[] = [
  { label: '草稿', value: 'draft' },
  { label: '已發佈', value: 'published' },
  { label: '已停用', value: 'disabled' },
];

const updateFields = ['title', 'category', 'status', 'content'];
const { handleSubmit, resetForm, setFieldValue } = useForm<KnowledgeFormValues>({
  initialValues: defaultValues,
  validationSchema: {
    title: 'required',
  },
});
const { formUpdate } = useAppForm(updateFields, setFieldValue);

watch(
  () => props.modelValue,
  value => {
    if (!value) {
      resetForm({ values: defaultValues });
      return;
    }

    resetForm({ values: defaultValues });
    formUpdate({
      title: value.title ?? '',
      category: value.category ?? '',
      status: value.status ?? 'draft',
      content: value.content ?? '',
    });
  },
  { immediate: true, deep: true },
);

const onSubmit = handleSubmit(values => {
  emit('submit', {
    title: values.title.trim(),
    category: values.category,
    status: values.status,
    content: values.content,
  });
}) as (e?: Event) => Promise<void>;
</script>

<template>
  <UForm id="knowledge-editor-form" :state="{}" class="space-y-5" @submit="onSubmit">
    <div class="flex flex-col gap-4">
      <FormField
        name="title"
        label="標題"
        placeholder="輸入知識庫標題"
        :disabled="loading"
        is-required
      />

      <div class="grid gap-4 md:grid-cols-2">
        <FormField
          name="category"
          label="分類"
          fieldType="select"
          :items="categoryOptions"
          placeholder="選擇分類"
          :disabled="loading"
        />

        <FormField
          name="status"
          label="狀態"
          fieldType="select"
          :items="statusOptions"
          :disabled="loading"
        />
      </div>

      <FormField
        name="content"
        label="內容"
        fieldType="textarea"
        placeholder="輸入知識庫內容"
        :rows="14"
        :disabled="loading"
      />
    </div>

    <div class="flex flex-wrap justify-end gap-2 my-4">
      <UButton
        type="button"
        variant="outline"
        color="neutral"
        :disabled="loading"
        @click="emit('cancel')"
      >
        返回列表
      </UButton>

      <UButton type="submit" :loading>
        {{ submitLabel }}
      </UButton>
    </div>
  </UForm>
</template>
