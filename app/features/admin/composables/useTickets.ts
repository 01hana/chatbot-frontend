/**
 * app/features/admin/composables/useTickets.ts (T-056)
 *
 * Domain store for Ticket API state.
 * Does NOT handle route query parsing — use useAdminListQuery for that.
 */

import {
  listTickets,
  getTicketDetail,
  updateTicketStatus as updateTicketStatusApi,
  addTicketNote as addTicketNoteApi,
} from '~/services/api/admin/tickets';
import type { TicketVM, TicketNoteVM, TicketStatus, TicketListParams } from '~/types/admin';

export function useTickets() {
  const tickets = ref<TicketVM[]>([]);
  const ticket = ref<TicketVM | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const total = ref(0);

  async function fetchTickets(params?: TicketListParams): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const res = await listTickets(params);
      tickets.value = res.data;
      total.value = res.meta.total;
    } catch (e) {
      error.value = e instanceof Error ? e.message : '載入失敗';
    } finally {
      loading.value = false;
    }
  }

  async function fetchTicketDetail(id: string): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      ticket.value = await getTicketDetail(id);
    } catch (e) {
      error.value = e instanceof Error ? e.message : '載入失敗';
    } finally {
      loading.value = false;
    }
  }

  async function updateTicketStatus(id: string, status: TicketStatus): Promise<TicketVM | null> {
    try {
      const updated = await updateTicketStatusApi(id, status);
      ticket.value = updated;
      return updated;
    } catch (e) {
      error.value = e instanceof Error ? e.message : '更新狀態失敗';
      return null;
    }
  }

  async function addTicketNote(id: string, note: string): Promise<TicketNoteVM | null> {
    try {
      return await addTicketNoteApi(id, note);
    } catch (e) {
      error.value = e instanceof Error ? e.message : '新增備註失敗';
      return null;
    }
  }

  return {
    tickets,
    ticket,
    loading,
    error,
    total,
    fetchTickets,
    fetchTicketDetail,
    updateTicketStatus,
    addTicketNote,
  };
}
