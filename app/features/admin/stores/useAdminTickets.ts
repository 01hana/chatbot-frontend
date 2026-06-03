import { defineStore } from 'pinia';
import TicketService from '~/services/api/admin/tickets';
import type { DtParams, DtTableResult } from '~/libs/vxe-table';
import { cleanParams, firstValue, toAdminListParams } from '~/libs/vxe-table/adapters';
import type {
  TicketListParams,
  TicketPriority,
  TicketStatus,
  TicketSummaryVM,
} from '~/types/admin';

export const useAdminTickets = defineStore('admin-tickets', () => {
  function toTicketListParams(params: DtParams): TicketListParams {
    const searches = params.searches ?? {};
    const filters = params.filters ?? {};

    return cleanParams({
      ...toAdminListParams(params),
      startDate: searches.startDate ?? searches.dateFrom,
      endDate: searches.endDate ?? searches.dateTo,
      status: firstValue<TicketStatus>(filters.status),
      priority: firstValue<TicketPriority>(filters.priority),
    }) as TicketListParams;
  }

  async function getTable(params: DtParams): Promise<DtTableResult<TicketSummaryVM>> {
    const query = toTicketListParams(params);
    const res = await TicketService.listTickets(query);

    return {
      data: res.data,
      p: res.meta.page,
      total: res.meta.total,
    };
  }

  async function get(id: string | number) {
    return await TicketService.getTicketDetail(id);
  }

  async function updateStatus(id: string | number, status: TicketStatus) {
    return await TicketService.updateTicketStatus(id, status);
  }

  async function createNote(id: string | number, note: string) {
    return await TicketService.createTicketNote(id, note);
  }

  return {
    getTable,
    get,
    updateStatus,
    createNote,
  };
});
