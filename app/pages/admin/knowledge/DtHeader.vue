<script setup lang="ts">
const emit = defineEmits<{
  'open-import': [];
}>();
</script>

<template>
  <div class="flex flex-wrap items-center justify-end gap-2">
    <TableHeader>
      <template #action>
        <UButton icon="i-heroicons-arrow-up-tray" variant="outline" @click="emit('open-import')">
          批次匯入
        </UButton>
      </template>
    </TableHeader>
  </div>
</template>
