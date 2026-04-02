<script setup lang="ts">
const { params, filters } = inject(DtUtils.key) as InstanceType<typeof DtUtils>;

onMounted(() => {
  const { getTable } = __HOOK__();

  getTable(params.value);
});
</script>

<template>
  <TableData :sort="['updated_at', 'desc']">
    <vxe-column min-width="150" field="updated_at" title="最後更新時間" />
  </TableData>
</template>
