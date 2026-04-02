<script setup lang="ts">
import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    icon?: string;
    hideLabel?: boolean;
  }>(),
  {
    icon: '',
    hideLabel: false,
  },
);

const { icon, hideLabel } = toRefs(props);

const { t, locale } = useI18n();
const attrs = useAttrs();

const id = ref(`text-field-${useId()}`);
const label = computed(() => attrs?.label as string | undefined);
const fieldName = computed(() => attrs?.name as string);
const isDisabled = computed(() => attrs?.disabled === '' || attrs?.disabled);

const { value: modelValue, errorMessage: errorMessages } = useField<any>(
  () => fieldName.value ?? id.value,
  undefined,
  {
    label,
    syncVModel: true,
  },
);

const df = new DateFormatter(locale.value, { dateStyle: 'medium' });
const timeZone = getLocalTimeZone();

// 若初始 value 存在日期字串，轉換成 CalendarDate
const calendarValue = computed({
  get() {
    if (!modelValue.value) return null;

    const date = new Date(modelValue.value);

    return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
  },
  set(value: any) {
    if (value)
      modelValue.value = value.toDate(timeZone).toISOString().split('T')[0]; // 格式化為 YYYY-MM-DD
    else modelValue.value = null;
  },
});
</script>

<template>
  <UFormField
    :error="errorMessages"
    :disabled="isDisabled"
    v-bind="{
      ...$attrs,
      id,
    }"
  >
    <template #label>
      <div class="flex items-center gap-1">
        <UIcon v-if="icon" :name="icon" class="w-4 h-4" />
        <span v-if="!hideLabel" class="text-base">{{ label }}</span>
      </div>
    </template>

    <UPopover>
      <UButton
        color="neutral"
        variant="outline"
        icon="i-lucide-calendar"
        block
        class="justify-start"
      >
        {{
          calendarValue ? df.format(calendarValue.toDate(timeZone)) : `${t('actions.selectDate')}`
        }}
      </UButton>

      <template #content>
        <UCalendar v-model="calendarValue" class="p-2" />
      </template>
    </UPopover>
  </UFormField>
</template>
