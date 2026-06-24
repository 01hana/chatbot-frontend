<template>
  <div class="flex flex-wrap items-center justify-end gap-2">
    <TableHeader :actions="{ create: false, batch: false, remove: false }">
      <template #action>
        <UButton icon="i-heroicons-plus" to="/admin/intent/create">
          新增意圖
        </UButton>
      </template>
    </TableHeader>
  </div>
</template>
