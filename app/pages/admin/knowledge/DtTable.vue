<script setup lang="ts">
import AppStatusBadge from '~/features/admin/components/AppStatusBadge.vue';
import type { KnowledgeEntrySummaryVM, KnowledgeStatus } from '~/types/admin';

const { params } = inject(DtUtils.key) as InstanceType<typeof DtUtils>;

const { getTable } = useAdminKnowledge();
const router = useRouter();

const categoryFilters = [
  { label: '產品規格', value: '產品規格' },
  { label: '使用教學', value: '使用教學' },
  { label: '故障排除', value: '故障排除' },
  { label: '訂購流程', value: '訂購流程' },
];

const statusFilters: { label: string; value: KnowledgeStatus }[] = [
  { label: '草稿', value: 'draft' },
  { label: '已發佈', value: 'published' },
  { label: '已停用', value: 'disabled' },
];

onMounted(() => {
  getTable(params.value);
});

function onEdit(row: KnowledgeEntrySummaryVM) {
  router.push(`/admin/knowledge/${row.id}/edit`);
}
</script>

<template>
  <TableData :sort="['updatedAt', 'desc']" :actions="{ edit: true, remove: true }">
    <template #actions="{ row, setDeleteConfirm }">
      <div class="d-flex justify-end flex-wrap gap-1">
        <UButton
          icon="fluent:edit-line-horizontal-3-24-regular"
          variant="ghost"
          @click="onEdit(row as KnowledgeEntrySummaryVM)"
        />

        <UButton
          icon="fluent:delete-24-regular"
          variant="ghost"
          color="error"
          class="text-red-400"
          @click="setDeleteConfirm(row.id, row.title)"
        />
      </div>
    </template>

    <vxe-column min-width="260" field="title" title="標題" sortable />

    <vxe-column min-width="160" field="category" title="分類" :filters="categoryFilters">
      <template #default="{ row }">
        {{ row.category || '-' }}
      </template>
    </vxe-column>

    <vxe-column min-width="140" field="status" title="狀態" align="center" :filters="statusFilters">
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
