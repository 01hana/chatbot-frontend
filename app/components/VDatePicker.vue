<script setup lang="ts">
import { AppDateTimePicker, AppTimePicker } from '@boichikpro/vue3-date-time-picker';
import '@boichikpro/vue3-date-time-picker/assets/style.css';
import '@boichikpro/vue3-date-time-picker/assets/variables.css';

import { endOfMonth, startOfMonth, subMonths, subDays } from 'date-fns';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    icon?: string;
    hideLabel?: boolean;
    isDateTime?: boolean;
    isYear?: boolean;
    isMonth?: boolean;
    isTime?: boolean;
    isRange?: boolean;
  }>(),
  {
    icon: '',
    hideLabel: false,
    isDateTime: false,
    isYear: false,
    isMonth: false,
    isTime: false,
    isRange: false,
  },
);

const { icon, hideLabel, isDateTime, isYear, isMonth, isTime, isRange } = toRefs(props);

const { t, locale } = useI18n();
const attrs = useAttrs();

const id = ref(`text-field-${useId()}`);
const label = computed(() => attrs?.label as string | undefined);
const fieldName = computed(() => attrs?.name as string);
const isDisabled = computed(() => attrs?.disabled === '' || attrs?.disabled);
const mode = computed(() => {
  if (isMonth.value) return 'month';
  if (isYear.value) return 'year';

  return 'day';
});
const type = computed(() => {
  if (isRange.value && isDateTime.value) return 'datetimerange';
  if (isRange.value) return 'daterange';
  if (isDateTime.value) return 'datetime';
});
const dateFormat = computed(() => {
  if (isMonth.value) return 'yyyy/MM';
  if (isYear.value) return 'yyyy';
});
const timeFormat = computed(() => {
  if (isDateTime.value) return 'HH:mm';
});
const shortcuts = computed(() => {
  return !isRange.value || (isRange.value && isTime.value)
    ? []
    : [
        { text: t('vDatePicker.today'), value: [new Date(), new Date()] },
        {
          text: t('vDatePicker.yesterday'),
          value: [subDays(new Date(), 1), new Date()],
        },
        {
          text: t('vDatePicker.lastWeek'),
          value: [subDays(new Date(), 6), new Date()],
        },
        {
          text: t('vDatePicker.lastThirtyDays'),
          value: [subDays(new Date(), 29), new Date()],
        },
        {
          text: t('vDatePicker.halfYear'),
          value: [subMonths(new Date(), 5), new Date()],
        },
        {
          text: t('vDatePicker.lastMonth'),
          value: [startOfMonth(subMonths(new Date(), 1)), endOfMonth(subMonths(new Date(), 1))],
        },
        {
          text: t('vDatePicker.thisMonth'),
          value: [startOfMonth(new Date()), endOfMonth(new Date())],
        },
        {
          text: t('vDatePicker.lastYear'),
          value: [subMonths(new Date(), 11), new Date()],
        },
      ];
});

const { value: modelValue, errorMessage: errorMessages } = useField<any>(
  () => fieldName.value ?? id.value,
  undefined,
  {
    label,
    syncVModel: true,
  },
);
</script>

<template>
  <UFormField
    :error="errorMessages"
    :disabled="isDisabled"
    v-bind="{
      id,
    }"
  >
    <template #label>
      <div class="flex items-center gap-1">
        <UIcon v-if="icon" :name="icon" class="w-4 h-4" />
        <span v-if="!hideLabel" class="text-base">{{ label }}</span>
      </div>
    </template>

    <AppTimePicker
      v-if="isTime"
      v-bind="$attrs"
      v-model="modelValue"
      :locale
      :isRange
      :format="timeFormat"
      auto-apply
    />
    <AppDateTimePicker
      v-else
      v-bind="$attrs"
      v-model="modelValue"
      :locale
      :mode
      :type
      :dateFormat
      :timeFormat
      :shortcuts
      auto-apply
    />
  </UFormField>
</template>

<style scoped>
:deep(.app-datetime-picker-input) {
  --vpick--input-border-width: 1px;
}

:deep(.app-time-picker-input) {
  --vpick--input-border-width: 1px;
}
</style>
