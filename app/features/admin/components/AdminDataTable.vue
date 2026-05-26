<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = any;

const props = withDefaults(
  defineProps<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    columns: any[];
    data: AnyRow[];
    total: number;
    page: number;
    pageSize: number;
    loading?: boolean;
    emptyText?: string;
  }>(),
  {
    loading: false,
    emptyText: '沒有資料',
  },
);

const emit = defineEmits<{
  'update:page': [page: number];
  'update:sort': [sort: { column: string; direction: 'asc' | 'desc' }];
  rowClick: [row: AnyRow];
}>();

const totalPages = computed(() => Math.ceil(props.total / props.pageSize));

function onSort(sort: { column: string; direction: 'asc' | 'desc' }) {
  emit('update:sort', sort);
}

function onSelect(_e: Event, row: AnyRow) {
  emit('rowClick', row);
}
</script>

<template>
  <div class="space-y-4">
    <UTable :columns :data :loading @select="onSelect" @update:sort="onSort">
      <template #empty-state>
        <AppEmptyState :title="emptyText ?? '沒有資料'" />
      </template>
    </UTable>

    <div v-if="totalPages > 1" class="flex justify-end">
      <UPagination
        :total
        :page-count="pageSize"
        :model-value="page"
        @update:model-value="(p: number) => emit('update:page', p)"
      />
    </div>
  </div>
</template>
