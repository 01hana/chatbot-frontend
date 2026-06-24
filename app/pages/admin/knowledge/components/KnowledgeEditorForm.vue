<script setup lang="ts">
type KnowledgeFormValues = {
  title: string;
  category: string;
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

const updateFields = ['title', 'category', 'content'];
const { handleSubmit, resetForm, setFieldValue } = useForm<KnowledgeFormValues>({
  validationSchema: {
    title: 'required',
  },
});
const { formUpdate } = useAppForm(updateFields, setFieldValue);
const { categoryItems } = storeToRefs(useAdminKnowledge());

watch(
  () => props.modelValue,
  value => {
    if (!value) {
      resetForm();
      return;
    }

    resetForm();
    formUpdate(value);
  },
  { immediate: true, deep: true },
);

const onSubmit = handleSubmit(values => {
  emit('submit', values);
}) as (e?: Event) => Promise<void>;
</script>

<template>
  <UForm id="knowledge-editor-form" :state="{}" class="space-y-5 my-4" @submit="onSubmit">
    <div class="flex flex-col gap-4">
      <FormField
        name="title"
        label="標題"
        placeholder="輸入知識庫標題"
        :disabled="loading"
        is-required
      />

      <FormField
        name="category"
        label="知識分類"
        fieldType="select"
        :items="categoryItems"
        placeholder="選擇分類"
        :disabled="loading"
      />

      <FormField
        name="content"
        label="內容"
        fieldType="textarea"
        placeholder="輸入知識庫內容"
        :rows="14"
        :disabled="loading"
      />
    </div>

    <div class="flex flex-wrap justify-end gap-2">
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
