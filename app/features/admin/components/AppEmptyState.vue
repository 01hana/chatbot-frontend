<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    icon?: string;
    title: string;
    description?: string;
  }>(),
  {
    icon: 'i-heroicons-inbox',
  },
);
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 text-center gap-3">
    <UIcon :name="icon" class="w-10 h-10 text-gray-300" />
    <p class="text-sm font-medium text-gray-500">{{ title }}</p>
    <p v-if="description" class="text-xs text-gray-400 max-w-xs">{{ description }}</p>
    <slot name="action" />
  </div>
</template>
