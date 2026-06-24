<script setup lang="ts">
import type { LocaleKey } from '~/types/chat';
import type { WidgetSettingsVM } from '~/types/admin';

type WidgetSettingsFormValues = {
  status: WidgetSettingsVM['status'];
  welcomeZh: string;
  welcomeEn: string;
  disclaimerZh: string;
  disclaimerEn: string;
  fallbackZh: string;
  fallbackEn: string;
  quickRepliesZh: string;
  quickRepliesEn: string;
};

const props = withDefaults(
  defineProps<{
    modelValue: WidgetSettingsVM | null;
    loading?: boolean;
  }>(),
  {
    loading: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: WidgetSettingsVM];
  submit: [value: WidgetSettingsVM];
}>();

const statusItems = [
  { label: '線上', value: 'online' },
  { label: '離線', value: 'offline' },
  { label: '降級', value: 'degraded' },
];
const defaultValues: WidgetSettingsFormValues = {
  status: 'online',
  welcomeZh: '',
  welcomeEn: '',
  disclaimerZh: '',
  disclaimerEn: '',
  fallbackZh: '',
  fallbackEn: '',
  quickRepliesZh: '',
  quickRepliesEn: '',
};
const updateFields = Object.keys(defaultValues);
const [syncing, setSyncing] = useAppState(false);

const { handleSubmit, resetForm, setFieldValue, values } = useForm<WidgetSettingsFormValues>({
  initialValues: defaultValues,
  validationSchema: {
    status: 'required',
  },
});
const { formUpdate } = useAppForm(updateFields, setFieldValue);

watch(
  () => props.modelValue,
  async value => {
    setSyncing(true);
    resetForm({ values: defaultValues });
    if (value) formUpdate(toFormValues(value));
    await nextTick();
    setSyncing(false);
  },
  { immediate: true, deep: true },
);

watch(
  values,
  value => {
    if (syncing.value) return;
    emit('update:modelValue', toSettings(value));
  },
  { deep: true },
);

function localeText(value: Partial<Record<LocaleKey, string>> | undefined, locale: LocaleKey) {
  return value?.[locale] ?? '';
}

function joinReplies(value: string[] | undefined) {
  return (value ?? []).join('\n');
}

function splitReplies(value: string) {
  return value
    .split('\n')
    .map(item => item.trim())
    .filter(Boolean);
}

function toFormValues(settings: WidgetSettingsVM): WidgetSettingsFormValues {
  return {
    status: settings.status ?? 'online',
    welcomeZh: localeText(settings.welcomeMessage, 'zh-TW'),
    welcomeEn: localeText(settings.welcomeMessage, 'en'),
    disclaimerZh: localeText(settings.disclaimer, 'zh-TW'),
    disclaimerEn: localeText(settings.disclaimer, 'en'),
    fallbackZh: localeText(settings.fallbackMessage, 'zh-TW'),
    fallbackEn: localeText(settings.fallbackMessage, 'en'),
    quickRepliesZh: joinReplies(settings.quickReplies?.['zh-TW']),
    quickRepliesEn: joinReplies(settings.quickReplies?.en),
  };
}

function toSettings(value: WidgetSettingsFormValues): WidgetSettingsVM {
  return {
    ...(props.modelValue ?? { quickReplies: {} }),
    status: value.status,
    welcomeMessage: {
      'zh-TW': value.welcomeZh,
      en: value.welcomeEn,
    },
    disclaimer: {
      'zh-TW': value.disclaimerZh,
      en: value.disclaimerEn,
    },
    fallbackMessage: {
      'zh-TW': value.fallbackZh,
      en: value.fallbackEn,
    },
    quickReplies: {
      'zh-TW': splitReplies(value.quickRepliesZh),
      en: splitReplies(value.quickRepliesEn),
    },
  };
}

const onSubmit = handleSubmit(value => {
  emit('submit', toSettings(value));
}) as (e?: Event) => Promise<void>;
</script>

<template>
  <UCard>
    <template #header>
      <p class="text-sm font-medium text-gray-700">設定表單</p>
    </template>

    <UForm id="widget-settings-form" :state="{}" class="space-y-5" @submit="onSubmit">
      <FormField
        name="status"
        label="服務狀態"
        fieldType="select"
        :items="statusItems"
        :disabled="loading"
      />

      <div class="grid gap-4 md:grid-cols-2">
        <FormField name="welcomeZh" label="歡迎訊息（繁中）" fieldType="textarea" :rows="3" :disabled="loading" />
        <FormField name="welcomeEn" label="歡迎訊息（英文）" fieldType="textarea" :rows="3" :disabled="loading" />
        <FormField name="infoBarZh" label="Info Bar（繁中）" :disabled="loading" />
        <FormField name="infoBarEn" label="Info Bar（英文）" :disabled="loading" />
        <FormField name="disclaimerZh" label="免責聲明（繁中）" fieldType="textarea" :rows="3" :disabled="loading" />
        <FormField name="disclaimerEn" label="免責聲明（英文）" fieldType="textarea" :rows="3" :disabled="loading" />
        <FormField name="fallbackZh" label="Fallback 文案（繁中）" fieldType="textarea" :rows="3" :disabled="loading" />
        <FormField name="fallbackEn" label="Fallback 文案（英文）" fieldType="textarea" :rows="3" :disabled="loading" />
        <FormField name="serviceHoursZh" label="服務時間（繁中）" :disabled="loading" />
        <FormField name="serviceHoursEn" label="服務時間（英文）" :disabled="loading" />
        <FormField
          name="quickRepliesZh"
          label="快捷提問（繁中，每行一筆）"
          fieldType="textarea"
          :rows="5"
          :disabled="loading"
        />
        <FormField
          name="quickRepliesEn"
          label="快捷提問（英文，每行一筆）"
          fieldType="textarea"
          :rows="5"
          :disabled="loading"
        />
      </div>

      <div class="flex justify-end">
        <UButton type="submit" :loading>儲存設定</UButton>
      </div>
    </UForm>
  </UCard>
</template>
