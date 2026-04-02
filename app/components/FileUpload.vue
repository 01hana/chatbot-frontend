<script setup lang="ts">
defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    multiple?: boolean;
    accept?: string;
    fileIcon?: string;
  }>(),
  {
    multiple: false,
    accept: '',
    fileIcon: 'i-lucide-image',
  },
);

const { multiple, accept, fileIcon } = toRefs(props);

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
    <UFileUpload
      v-model="value"
      :icon="fileIcon"
      :multiple
      :accept
      :layout="multiple ? 'grid' : undefined"
      class="min-h-48"
    >
    </UFileUpload>
  </UFormField>
</template>
