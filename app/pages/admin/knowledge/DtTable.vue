<script setup lang="ts">
import AppStatusBadge from '~/features/admin/components/AppStatusBadge.vue';

const { params, filters } = inject(DtUtils.key) as InstanceType<typeof DtUtils>;

const { getTable, getFilters } = useAdminKnowledge();

onMounted(() => {
  getTable(params.value);
  getFilters(['category', 'status']);
});
</script>

<template>
  <TableData :sort="['updatedAt', 'desc']" :actions="{ edit: true, remove: true }">
    <vxe-column min-width="260" field="title" title="標題" sortable />

    <vxe-column min-width="160" field="category" title="分類" :filters>
      <template #default="{ row }">
        {{ row.category || '-' }}
      </template>
    </vxe-column>

    <vxe-column min-width="140" field="status" title="狀態" align="center" :filters>
      <template #default="{ row }">
        <AppStatusBadge :status="row.status" />
      </template>
    </vxe-column>

    <vxe-column
      min-width="180"
      field="updatedAt"
      title="最後更新時間"
      formatter="formatDate"
      sortable
    />
  </TableData>
</template>
