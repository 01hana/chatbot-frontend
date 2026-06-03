<script setup lang="ts">
const router = useRouter();

const emit = defineEmits<{
  'open-import': [];
}>();
</script>

<template>
  <div class="flex flex-wrap items-center justify-end gap-2">
    <UButton
      icon="i-heroicons-plus"
      class="shadow-xs transition-all duration-200 hover:shadow-md active:scale-95"
      @click="router.push('/admin/knowledge/new')"
    >
      新增知識庫
    </UButton>

    <UButton icon="i-heroicons-arrow-up-tray" variant="outline" @click="emit('open-import')">
      批次匯入
    </UButton>
  </div>
</template>
