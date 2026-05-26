/**
 * Admin Leads API Service (T-051)
 *
 * GET   /admin/leads       → PaginatedResponse<LeadVM>
 * GET   /admin/leads/:id   → LeadVM
 * PATCH /admin/leads/:id   → LeadVM
 */

import { createAdminClient } from './client';
import type { LeadVM, LeadListParams, LeadUpdatePayload } from '~/types/admin';
import type { PaginatedResponse, ApiResponse } from '~/types/api';

/**
 * List leads with optional filters.
 * GET /admin/leads
 */

export async function listLeads(params?: LeadListParams): Promise<PaginatedResponse<LeadVM>> {
  const client = createAdminClient();

  const res = await client<ApiResponse<PaginatedResponse<LeadVM>>>('admin/leads', {
    method: 'GET',
    query: params,
  });

  return res.data;
}

/**
 * Fetch the detail of a single lead record.
 * GET /admin/leads/:id
 */
export async function getLeadDetail(id: string): Promise<LeadVM> {
  const client = createAdminClient();
  const res = await client<ApiResponse<LeadVM>>(`admin/leads/${id}`, {
    method: 'GET',
  });
  return res.data;
}

/**
 * Partially update a lead (status, note, etc.).
 * PATCH /admin/leads/:id
 */
export async function updateLead(id: string, data: LeadUpdatePayload): Promise<LeadVM> {
  const client = createAdminClient();
  const res = await client<ApiResponse<LeadVM>>(`admin/leads/${id}`, {
    method: 'PATCH',
    body: data,
  });
  return res.data;
}
