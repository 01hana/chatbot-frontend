<script setup lang="ts">
/**
 * /admin/tickets/[id] — Ticket 詳情 (T-056)
 *
 * Uses:
 * - useFormat       — formatDateTime (no local formatDate)
 * - AppStatusBadge  — status display (no local STATUS_LABEL)
 * - useAdminTickets — domain store actions
 *
 * Status update: PATCH /admin/tickets/:id/status
 * Note add:      POST  /admin/tickets/:id/notes
 */

import type { TicketStatus, TicketVM } from '~/types/admin'

definePageMeta({ layout: 'admin', title: 'Ticket 詳情' })

const route = useRoute()
const id = computed(() => String(route.params.id))
const toast = useToast()

const { formatDateTime } = useFormat()
const ticketStore = useAdminTickets()

const ticket = ref<TicketVM | null>(null)
const [loading, setLoading] = useAppState(true)
const error = ref('')

onMounted(loadTicket)

// ── Edit state ─────────────────────────────────────────────────────────────

const editStatus = ref<TicketStatus>('open')
const newNote = ref('')
const [saving, setSaving] = useAppState(false)

watch(
  ticket,
  (val) => {
    if (val) {
      editStatus.value = val.status
    }
  },
  { immediate: true },
)

const statusOptions = [
  { label: '開啟', value: 'open' },
  { label: '處理中', value: 'in_progress' },
  { label: '已解決', value: 'resolved' },
  { label: '已關閉', value: 'closed' },
]

async function loadTicket() {
  setLoading(true)
  error.value = ''

  try {
    ticket.value = await ticketStore.get(id.value)
  } catch (e) {
    ticket.value = null
    error.value = e instanceof Error ? e.message : '載入 Ticket 失敗，請稍後再試'
  } finally {
    setLoading(false)
  }
}

async function handleSubmit() {
  if (!ticket.value) return
  setSaving(true)

  try {
    if (editStatus.value !== ticket.value.status) {
      await ticketStore.updateStatus(id.value, editStatus.value)
    }

    if (newNote.value.trim()) {
      await ticketStore.createNote(id.value, newNote.value.trim())
      newNote.value = ''
    }

    toast.add({ title: '更新成功', color: 'success' })
    await loadTicket()
  } finally {
    setSaving(false)
  }
}

function getTimelineIcon(eventType: string): string {
  if (eventType === 'status_change') return 'i-heroicons-arrow-path'
  if (eventType === 'note_added') return 'i-heroicons-chat-bubble-left-ellipsis'
  return 'i-heroicons-plus-circle'
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
        to="/admin/tickets"
      >
        返回列表
      </UButton>
      <h2 class="text-lg font-semibold text-gray-800">Ticket 詳情</h2>
    </div>

    <!-- Error (before data loads) -->
    <AppErrorState
      v-if="error && !ticket"
      :message="error"
      @retry="loadTicket"
    />

    <!-- Loading skeleton -->
    <div v-else-if="loading && !ticket" class="space-y-4">
      <div class="h-48 rounded-xl bg-gray-100 animate-pulse" />
    </div>

    <!-- Empty -->
    <AppEmptyState v-else-if="!ticket" title="找不到 Ticket 資料" />

    <template v-else>
      <!-- Ticket info card -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-gray-700">Ticket 資訊</p>
            <AppStatusBadge :status="ticket.status" />
          </div>
        </template>

        <dl class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <dt class="text-gray-500 text-xs">Ticket ID</dt>
            <dd
              class="font-mono text-gray-800 mt-0.5 truncate text-xs"
              :title="ticket.id"
            >
              {{ ticket.id }}
            </dd>
          </div>
          <div v-if="ticket.title">
            <dt class="text-gray-500 text-xs">主旨</dt>
            <dd class="text-gray-800 mt-0.5">{{ ticket.title }}</dd>
          </div>
          <div>
            <dt class="text-gray-500 text-xs">建立時間</dt>
            <dd class="text-gray-800 mt-0.5">{{ formatDateTime(ticket.createdAt) }}</dd>
          </div>
          <div v-if="ticket.resolvedAt">
            <dt class="text-gray-500 text-xs">解決時間</dt>
            <dd class="text-gray-800 mt-0.5">{{ formatDateTime(ticket.resolvedAt) }}</dd>
          </div>
          <div v-if="ticket.sessionId">
            <dt class="text-gray-500 text-xs">關聯對話</dt>
            <dd class="mt-0.5">
              <UButton
                variant="link"
                size="xs"
                :to="`/admin/conversations/${ticket.sessionId}`"
                class="p-0 h-auto"
              >
                查看對話
              </UButton>
            </dd>
          </div>
        </dl>

        <div v-if="ticket.summary" class="mt-4 border-t pt-4">
          <dt class="text-gray-500 text-xs">問題描述</dt>
          <dd class="text-gray-800 mt-1 text-sm whitespace-pre-wrap">{{ ticket.summary }}</dd>
        </div>
      </UCard>

      <!-- Timeline -->
      <UCard v-if="ticket.timeline?.length">
        <template #header>
          <p class="text-sm font-medium text-gray-700">處理紀錄</p>
        </template>

        <div class="relative">
          <div
            v-for="(event, index) in ticket.timeline"
            :key="event.id"
            class="flex gap-3"
          >
            <!-- Timeline icon column -->
            <div class="flex flex-col items-center shrink-0">
              <div
                class="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <UIcon
                  :name="getTimelineIcon(event.eventType)"
                  class="w-3.5 h-3.5 text-gray-500"
                />
              </div>
              <div
                v-if="index < (ticket.timeline?.length ?? 0) - 1"
                class="w-px flex-1 bg-gray-200 mt-1 min-h-4"
              />
            </div>

            <!-- Event content -->
            <div class="pb-5 flex-1 min-w-0">
              <p class="text-xs text-gray-400 mb-1">
                {{ formatDateTime(event.occurredAt) }}
                <span v-if="event.createdBy" class="ml-1">· {{ event.createdBy }}</span>
              </p>

              <template v-if="event.eventType === 'status_change'">
                <p class="text-sm text-gray-700 flex flex-wrap items-center gap-1">
                  狀態變更：
                  <AppStatusBadge v-if="event.fromStatus" :status="event.fromStatus" />
                  <UIcon
                    name="i-heroicons-arrow-right"
                    class="w-3 h-3 text-gray-400"
                  />
                  <AppStatusBadge v-if="event.toStatus" :status="event.toStatus" />
                </p>
              </template>

              <template v-else-if="event.eventType === 'note_added'">
                <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ event.content }}</p>
              </template>

              <template v-else>
                <p class="text-sm text-gray-700">建立 Ticket</p>
              </template>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Action panel -->
      <UCard>
        <template #header>
          <p class="text-sm font-medium text-gray-700">更新狀態 / 新增備註</p>
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
            <label class="block text-xs text-gray-500 mb-1">新增備註</label>
            <UTextarea
              v-model="newNote"
              :rows="3"
              placeholder="輸入備註內容…"
              size="sm"
            />
          </div>
          <div class="flex justify-end">
            <UButton :loading="saving" @click="handleSubmit">送出</UButton>
          </div>
        </div>
      </UCard>
    </template>
  </div>
</template>
