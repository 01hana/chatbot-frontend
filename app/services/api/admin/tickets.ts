/**
 * Admin Tickets API Service (T-051)
 *
 * GET  /admin/tickets                   → PaginatedResponse<TicketVM>
 * GET  /admin/tickets/:id               → TicketVM
 * PATCH /admin/tickets/:id/status       → TicketVM
 * POST  /admin/tickets/:id/notes        → TicketNoteVM
 */

import { createAdminClient } from './client';
import type { TicketVM, TicketNoteVM, TicketStatus, TicketListParams } from '~/types/admin';
import type { PaginatedResponse, ApiResponse } from '~/types/api';

/**
 * List tickets with optional filters.
 * GET /admin/tickets
 */
export async function listTickets(params?: TicketListParams): Promise<PaginatedResponse<TicketVM>> {
  const client = createAdminClient();

  const res = await client<ApiResponse<PaginatedResponse<TicketVM>>>('admin/tickets', {
    method: 'GET',
    query: params,
  });

  return res.data;
}

/**
 * Fetch the full detail of a single ticket (includes notes and timeline).
 * GET /admin/tickets/:id
 */
export async function getTicketDetail(id: string): Promise<TicketVM> {
  const client = createAdminClient();
  const res = await client<ApiResponse<TicketVM>>(`admin/tickets/${id}`, {
    method: 'GET',
  });
  return res.data;
}

/**
 * Update the status of a ticket.
 * PATCH /admin/tickets/:id/status
 */
export async function updateTicketStatus(id: string, status: TicketStatus): Promise<TicketVM> {
  const client = createAdminClient();
  const res = await client<ApiResponse<TicketVM>>(`admin/tickets/${id}/status`, {
    method: 'PATCH',
    body: { status },
  });
  return res.data;
}

/**
 * Add a note to a ticket.
 * POST /admin/tickets/:id/notes
 */
export async function addTicketNote(id: string, note: string): Promise<TicketNoteVM> {
  const client = createAdminClient();
  const res = await client<ApiResponse<TicketNoteVM>>(`admin/tickets/${id}/notes`, {
    method: 'POST',
    body: { content: note },
  });
  return res.data;
}
