/**
 * Admin Tickets API Service (T-051)
 *
 * GET   /admin/tickets              → PaginatedResponse<TicketVM>
 * GET   /admin/tickets/:id          → TicketVM
 * PATCH /admin/tickets/:id/status   → TicketVM
 * POST  /admin/tickets/:id/notes    → TicketNoteVM
 */

import httpRequest from '@/services/index';
import type { TicketListParams, TicketNoteVM, TicketStatus, TicketVM } from '~/types/admin';
import type { ApiResponse, PaginatedResponse } from '~/types/api';

class TicketService {
  public async listTickets(params?: TicketListParams): Promise<PaginatedResponse<TicketVM>> {
    const res = await httpRequest.get<ApiResponse<PaginatedResponse<TicketVM>>>(
      'admin/tickets',
      params,
    );

    return res.data;
  }

  public async getTicket(id: string | number): Promise<TicketVM> {
    const res = await httpRequest.get<ApiResponse<TicketVM>>(`admin/tickets/${id}`);

    return res.data;
  }

  public async getTicketDetail(id: string | number): Promise<TicketVM> {
    return await this.getTicket(id);
  }

  public async updateTicketStatus(
    id: string | number,
    status: TicketStatus,
  ): Promise<TicketVM> {
    const res = await httpRequest.patch<ApiResponse<TicketVM>>(`admin/tickets/${id}/status`, {
      status,
    });

    return res.data;
  }

  public async createTicketNote(id: string | number, note: string): Promise<TicketNoteVM> {
    const res = await httpRequest.post<ApiResponse<TicketNoteVM>>(
      `admin/tickets/${id}/notes`,
      { content: note },
    );

    return res.data;
  }

  public async addTicketNote(id: string | number, note: string): Promise<TicketNoteVM> {
    return await this.createTicketNote(id, note);
  }
}

export default new TicketService();
