<script setup lang="ts">
import AppStatusBadge from '~/features/admin/components/AppStatusBadge.vue';
import type { LeadSummaryVM, LeadStatus } from '~/types/admin';

const { params } = inject(DtUtils.key) as InstanceType<typeof DtUtils>;

const { getTable } = useAdminLeads();

const statusFilters: { label: string; value: LeadStatus }[] = [
  { label: '新增', value: 'new' },
  { label: '已聯繫', value: 'contacted' },
  { label: '已評估', value: 'qualified' },
  { label: '已關閉', value: 'closed' },
];

onMounted(() => {
  getTable(params.value);
});

function formatContact(row: LeadSummaryVM) {
  return [row.phone, row.email].filter(Boolean).join(' / ') || '-';
}

function formatInquiry(value?: string) {
  if (!value) return '-';
  return value.length > 48 ? `${value.slice(0, 48)}...` : value;
}
</script>

<template>
  <TableData :sort="['createdAt', 'desc']" :actions="{ view: true, edit: false, remove: false }">
    <vxe-column min-width="160" field="name" title="姓名" sortable />

    <vxe-column min-width="180" field="company" title="公司" sortable>
      <template #default="{ row }">
        {{ row.company || '-' }}
      </template>
    </vxe-column>

    <vxe-column min-width="220" field="contactInfo" title="聯絡方式">
      <template #default="{ row }">
        {{ formatContact(row) }}
      </template>
    </vxe-column>

    <vxe-column min-width="240" field="inquiry" title="詢問品項">
      <template #default="{ row }">
        {{ formatInquiry(row.inquiry) }}
      </template>
    </vxe-column>

    <vxe-column min-width="150" field="createdAt" title="建立時間" formatter="formatDate" sortable />

    <vxe-column min-width="140" field="status" title="狀態" align="center" :filters="statusFilters">
      <template #default="{ row }">
        <AppStatusBadge :status="row.status || 'new'" />
      </template>
    </vxe-column>
  </TableData>
</template>
