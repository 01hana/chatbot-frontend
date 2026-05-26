<script setup lang="ts">
import type { ConversationSummaryVM } from '~/types/admin';
import AppStatusBadge from '~/features/admin/components/AppStatusBadge.vue';

const { params, filters } = inject(DtUtils.key) as InstanceType<typeof DtUtils>;

const { t } = useI18n();
const { t: tv } = usePageI18n();

const { getTable } = useAdminConversations();
const router = useRouter();

onMounted(() => {
  getTable(params.value);
});

function onRowClick(row: ConversationSummaryVM) {
  router.push(`/admin/conversations/${row.id}`);
}
</script>

<template>
  <TableData :sort="['updatedAt', 'desc']" :actions="{ edit: false, remove: false }">
    <vxe-column min-width="150" field="actions" title="" align="center">
      <template #default="{ row }">
        <UButton
          label="查看"
          variant="subtle"
          icon="fluent:line-horizontal-4-search-20-regular"
          @click="onRowClick(row)"
        />
      </template>
    </vxe-column>

    <vxe-column min-width="200" field="sessionId" title="Session ID">
      <template #default="{ row }">
        <div>{{ row.sessionId }}</div>
      </template>
    </vxe-column>

    <vxe-column min-width="200" field="messageCount" title="對話輪數" align="center" />

    <vxe-column min-width="150" field="lead" title="Lead" />

    <vxe-column min-width="150" field="status" title="狀態" align="center">
      <template #default="{ row }">
        <AppStatusBadge :status="row.status" />
      </template>
    </vxe-column>
    ˝
    <vxe-column
      min-width="200"
      field="createdAt"
      :title="t('form.createdAt')"
      formatter="formatDate"
      sortable
    />

    <vxe-column
      min-width="200"
      field="updatedAt"
      :title="t('form.updatedAt')"
      formatter="formatDate"
      sortable
    />
  </TableData>
</template>
