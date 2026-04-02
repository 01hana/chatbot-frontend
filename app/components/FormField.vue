<script setup lang="ts">
defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    icon?: string;
    fieldType?: string;
    hideLabel?: boolean;
    multiple?: boolean;
    isRequired?: boolean;
  }>(),
  {
    icon: '',
    fieldType: 'input',
    hideLabel: false,
    multiple: false,
    isRequired: false,
  },
);

const { icon, fieldType, hideLabel, multiple, isRequired } = toRefs(props);

const attrs = useAttrs();

const id = ref(`text-field-${useId()}`);

const label = computed(() => attrs?.label as string | undefined);
const fieldName = computed(() => attrs?.name as string);
const isDisabled = computed(() => attrs?.disabled === '' || attrs?.disabled);

const { value, errorMessage: errorMessages } = useField<any>(
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
      ...$attrs,
      id,
    }"
  >
    <template #label>
      <div class="block text-[12px] uppercase tracking-widest text-gray-400 mb-2 font-bold">
        <UIcon v-if="icon" :name="icon" class="w-4 h-4" />
        <span v-if="!hideLabel" class="text-base">{{ label }}</span>
        <span v-if="isRequired" class="text-red-500">*</span>
      </div>
    </template>

    <USelectMenu
      v-if="fieldType === 'select'"
      v-model="value"
      value-key="value"
      :multiple
      class="w-full"
      v-bind="$attrs"
      :items="$attrs.items as Record<string, string>[]"
    />

    <URadioGroup
      v-if="fieldType === 'radio'"
      v-model="value"
      value-key="value"
      size="xl"
      orientation="horizontal"
      v-bind="$attrs"
      :items="$attrs.items as Record<string, string>[]"
    />

    <USwitch
      v-if="fieldType === 'switch'"
      v-model="value"
      unchecked-icon="i-lucide-x"
      checked-icon="i-lucide-check"
      v-bind="{ ...$attrs, label: undefined }"
      :default-value="true"
    />

    <UInputNumber
      v-if="fieldType === 'number'"
      v-model="value"
      :default-value="0"
      class="w-full"
      :min="0"
      variant="outline"
      v-bind="$attrs"
    />

    <UTextarea
      v-if="fieldType === 'textarea'"
      v-model="value"
      autoresize
      class="w-full"
      v-bind="$attrs"
    />

    <UInput
      v-if="fieldType === 'input'"
      v-model="value"
      v-bind="$attrs"
      class="w-full"
      variant="outline"
    >
      <template v-if="$slots.leading" #leading>
        <slot name="leading" />
      </template>

      <template #trailing>
        <slot />
      </template>
    </UInput>
  </UFormField>
</template>

<style scoped>
:deep(label) {
  display: flex;
}
</style>
