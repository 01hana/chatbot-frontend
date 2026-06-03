<script setup lang="ts">
/**
 * /admin/leads/[id] — Lead 詳情 (T-055)
 *
 * Uses:
 * - useFormat       — formatDateTime (no local formatDate)
 * - AppStatusBadge  — status display (no local STATUS_LABEL)
 * - useLeads        — API state
 */

import { useLeads } from '~/features/admin/composables/useLeads'
import type { LeadUpdatePayload, LeadStatus } from '~/types/admin'

definePageMeta({ layout: 'admin', title: 'Lead 詳情' })

const route = useRoute()
const id = computed(() => String(route.params.id))
const toast = useToast()

const { formatDateTime } = useFormat()
const { lead, loading, error, fetchLeadDetail, updateLead } = useLeads()

onMounted(() => fetchLeadDetail(id.value))

// ── Edit state ─────────────────────────────────────────────────────────────

const editStatus = ref<LeadStatus | undefined>()
const editNote = ref('')
const saving = ref(false)

watch(
  lead,
  (val) => {
    if (val) {
      editStatus.value = val.status
      editNote.value = val.note ?? ''
    }
  },
  { immediate: true },
)

const statusOptions = [
  { label: '新增', value: 'new' },
  { label: '已聯繫', value: 'contacted' },
  { label: '已評估', value: 'qualified' },
  { label: '已關閉', value: 'closed' },
]

async function handleSave() {
  if (!lead.value) return
  saving.value = true
  const payload: LeadUpdatePayload = {
    status: editStatus.value,
    note: editNote.value,
  }
  const updated = await updateLead(id.value, payload)
  saving.value = false
  if (updated) {
    toast.add({ title: '儲存成功', color: 'success' })
  } else {
    toast.add({ title: '儲存失敗', description: error.value ?? '請稍後再試', color: 'error' })
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Back navigation -->
    <div class="flex items-center gap-3">
      <UButton
        icon="i-heroicons-arrow-left"
        variant="ghost"
        color="neutral"
        size="sm"
        to="/admin/leads"
      >
        返回列表
      </UButton>
      <h2 class="text-lg font-semibold text-gray-800">Lead 詳情</h2>
    </div>

    <!-- Error (before data loads) -->
    <AppErrorState
      v-if="error && !lead"
      :message="error"
      @retry="fetchLeadDetail(id)"
    />

    <!-- Loading skeleton -->
    <div v-else-if="loading && !lead" class="space-y-4">
      <div class="h-48 rounded-xl bg-gray-100 animate-pulse" />
    </div>

    <!-- Empty -->
    <AppEmptyState v-else-if="!lead" title="找不到 Lead 資料" />

    <template v-else>
      <!-- Basic info card -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-gray-700">基本資訊</p>
            <AppStatusBadge :status="lead.status ?? 'new'" />
          </div>
        </template>

        <dl class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <dt class="text-gray-500 text-xs">姓名</dt>
            <dd class="text-gray-800 mt-0.5 font-medium">{{ lead.name }}</dd>
          </div>
          <div>
            <dt class="text-gray-500 text-xs">公司</dt>
            <dd class="text-gray-800 mt-0.5">{{ lead.company || '-' }}</dd>
          </div>
          <div>
            <dt class="text-gray-500 text-xs">電子郵件</dt>
            <dd class="text-gray-800 mt-0.5">{{ lead.email || '-' }}</dd>
          </div>
          <div>
            <dt class="text-gray-500 text-xs">電話</dt>
            <dd class="text-gray-800 mt-0.5">{{ lead.phone || '-' }}</dd>
          </div>
          <div>
            <dt class="text-gray-500 text-xs">語系</dt>
            <dd class="text-gray-800 mt-0.5">{{ lead.language || '-' }}</dd>
          </div>
          <div>
            <dt class="text-gray-500 text-xs">建立時間</dt>
            <dd class="text-gray-800 mt-0.5">{{ formatDateTime(lead.createdAt) }}</dd>
          </div>
          <div v-if="lead.sessionId">
            <dt class="text-gray-500 text-xs">關聯對話</dt>
            <dd class="mt-0.5">
              <UButton
                variant="link"
                size="xs"
                :to="`/admin/conversations/${lead.sessionId}`"
                class="p-0 h-auto"
              >
                查看對話
              </UButton>
            </dd>
          </div>
        </dl>

        <div v-if="lead.inquiry" class="mt-4 border-t pt-4">
          <dt class="text-gray-500 text-xs">詢問品項</dt>
          <dd class="text-gray-800 mt-1 text-sm whitespace-pre-wrap">{{ lead.inquiry }}</dd>
        </div>
      </UCard>

      <!-- Management panel -->
      <UCard>
        <template #header>
          <p class="text-sm font-medium text-gray-700">管理</p>
        </template>
        <div class="space-y-4">
          <div>
            <label class="block text-xs text-gray-500 mb-1">狀態</label>
            <USelect
              v-model="editStatus"
              :options="statusOptions"
              size="sm"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">管理者備註</label>
            <UTextarea
              v-model="editNote"
              :rows="3"
              placeholder="輸入備註…"
              size="sm"
            />
          </div>
          <div class="flex justify-end">
            <UButton :loading="saving" @click="handleSave">儲存</UButton>
          </div>
        </div>
      </UCard>
    </template>
  </div>
</template>
