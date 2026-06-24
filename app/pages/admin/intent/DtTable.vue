<script setup lang="ts">
import type { IntentSummaryVM } from '~/types/admin';

const { params } = inject(DtUtils.key) as InstanceType<typeof DtUtils>;
const { getTable, actions } = useAdminIntent();

const enabledFilters = [
  { label: '啟用', value: true },
  { label: '停用', value: false },
];

onMounted(() => {
  getTable(params.value);
});

function keywordPreview(row: IntentSummaryVM) {
  return (row.keywords ?? row.examples ?? []).slice(0, 3);
}

function allKeywords(row: IntentSummaryVM) {
  return (row.keywords ?? row.examples ?? []).join('、');
}
</script>

<template>
  <TableData :sort="['priority', 'asc']" :actions="{ edit: true, remove: true }">
    <vxe-column min-width="220" field="title" title="意圖名稱" />

    <vxe-column min-width="260" field="keywords" title="觸發關鍵字">
      <template #default="{ row }">
        <div class="flex flex-wrap gap-1" :title="allKeywords(row)">
          <UBadge
            v-for="keyword in keywordPreview(row)"
            :key="keyword"
            variant="soft"
            color="neutral"
          >
            {{ keyword }}
          </UBadge>
          <span
            v-if="(row.keywords ?? row.examples ?? []).length > 3"
            class="text-xs text-gray-400"
          >
            +{{ (row.keywords ?? row.examples ?? []).length - 3 }}
          </span>
          <span v-if="!(row.keywords ?? row.examples ?? []).length" class="text-gray-400">-</span>
        </div>
      </template>
    </vxe-column>

    <vxe-column min-width="120" field="priority" title="優先級" align="center" sortable />

    <vxe-column
      min-width="140"
      field="status"
      title="啟用狀態"
      align="center"
      :filters="enabledFilters"
    >
      <template #default="{ row }">
        <FormField
          v-model="row.isActive"
          name="isActive"
          fieldType="switch"
          class="flex justify-center"
          @change="actions({ ids: [row.id], status: row.isActive })"
        />
      </template>
    </vxe-column>
  </TableData>
</template>
