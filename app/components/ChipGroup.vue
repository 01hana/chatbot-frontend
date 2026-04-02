<script setup lang="ts">
type Option = {
  label: string;
  value: string;
  color?: string;
};

const {
  modelValue,
  options,
  multiple = false,
  size = 'lg',
} = defineProps<{
  modelValue: string[] | string | null;
  options: Option[];
  multiple?: boolean;
  size?: 'lg' | 'xs' | 'sm' | 'md' | 'xl';
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[] | string | null): void;
}>();

const isSelected = (val: string) => {
  if (multiple) {
    return Array.isArray(modelValue) && modelValue.includes(val);
  }

  return modelValue === val;
};

function toggle(val: string) {
  if (multiple) {
    const current = Array.isArray(modelValue) ? [...modelValue] : [];

    if (current.includes(val)) {
      emit(
        'update:modelValue',
        current.filter(v => v !== val),
      );
    } else {
      emit('update:modelValue', [...current, val]);
    }
  } else {
    emit('update:modelValue', modelValue === val ? null : val);
  }
}
</script>

<template>
  <div class="flex gap-2 flex-wrap">
    <UButton
      v-for="opt in options"
      :key="opt.value"
      :size
      :variant="isSelected(opt.value) ? 'solid' : 'outline'"
      class="rounded-full not-only:last:rounded-full not-only:first:rounded-full px-4"
      @click="toggle(opt.value)"
    >
      {{ opt.label }}
    </UButton>
  </div>
</template>
