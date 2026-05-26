<script setup lang="ts">
const props = defineProps<{
  title: string;
  description?: string;
}>();
</script>

<template>
  <div class="flex items-start justify-between gap-4 mb-6">
    <div>
      <h2 class="text-xl font-semibold text-gray-900">{{ title }}</h2>
      <p v-if="props.description" class="mt-1 text-sm text-gray-500">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="flex items-center gap-2 shrink-0">
      <slot name="actions" />
    </div>
  </div>
</template>
