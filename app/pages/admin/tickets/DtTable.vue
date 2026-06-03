<script setup lang="ts">
import AppStatusBadge from '~/features/admin/components/AppStatusBadge.vue';
import type { TicketPriority, TicketStatus, TicketSummaryVM } from '~/types/admin';

const { params } = inject(DtUtils.key) as InstanceType<typeof DtUtils>;

const { getTable } = useAdminTickets();
const { getTicketPriorityLabel } = useAdminStatus();

const statusFilters: { label: string; value: TicketStatus }[] = [
  { label: '開啟', value: 'open' },
  { label: '處理中', value: 'in_progress' },
  { label: '已解決', value: 'resolved' },
  { label: '已關閉', value: 'closed' },
];

const priorityFilters: { label: string; value: TicketPriority }[] = [
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' },
];

onMounted(() => {
  getTable(params.value);
});

function formatSummary(row: TicketSummaryVM) {
  const value = row.summary || row.title;
  if (!value) return '-';
  return value.length > 56 ? `${value.slice(0, 56)}...` : value;
}
</script>

<template>
  <TableData :sort="['createdAt', 'desc']" :actions="{ view: true, edit: false, remove: false }">
    <vxe-column min-width="180" field="id" title="Ticket ID" />

    <vxe-column min-width="200" field="sessionId" title="關聯 Session / Lead">
      <template #default="{ row }">
        {{ row.sessionId || '-' }}
      </template>
    </vxe-column>

    <vxe-column min-width="260" field="summary" title="問題摘要">
      <template #default="{ row }">
        {{ formatSummary(row) }}
      </template>
    </vxe-column>

    <vxe-column min-width="150" field="createdAt" title="建立時間" formatter="formatDate" sortable />

    <vxe-column min-width="140" field="status" title="狀態" align="center" :filters="statusFilters">
      <template #default="{ row }">
        <AppStatusBadge :status="row.status" />
      </template>
    </vxe-column>

    <vxe-column
      min-width="140"
      field="priority"
      title="優先級"
      align="center"
      :filters="priorityFilters"
    >
      <template #default="{ row }">
        {{ row.priority ? getTicketPriorityLabel(row.priority) : '-' }}
      </template>
    </vxe-column>
  </TableData>
</template>
