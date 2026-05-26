<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    message?: string
    retryLabel?: string
  }>(),
  {
    message: '發生錯誤，請稍後再試。',
    retryLabel: '重試',
  },
)

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 text-center gap-4">
    <UIcon name="i-heroicons-exclamation-triangle" class="w-10 h-10 text-red-400" />
    <p class="text-sm text-gray-600">{{ props.message }}</p>
    <UButton
      variant="outline"
      color="neutral"
      size="sm"
      icon="i-heroicons-arrow-path"
      @click="emit('retry')"
    >
      {{ props.retryLabel }}
    </UButton>
  </div>
</template>
