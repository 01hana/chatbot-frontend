/**
 * Admin Leads API Service (T-051)
 *
 * GET   /admin/leads            → PaginatedResponse<LeadVM>
 * GET   /admin/leads/:id        → LeadVM
 * PATCH /admin/leads/:id/status → LeadVM
 * PATCH /admin/leads/:id        → LeadVM
 */

import httpRequest from '@/services/index';
import type { LeadListParams, LeadStatus, LeadUpdatePayload, LeadVM } from '~/types/admin';
import type { ApiResponse, PaginatedResponse } from '~/types/api';

class LeadService {
  public async listLeads(params?: LeadListParams): Promise<PaginatedResponse<LeadVM>> {
    const res = await httpRequest.get<ApiResponse<PaginatedResponse<LeadVM>>>(
      'admin/leads',
      params,
    );

    return res.data;
  }

  public async getLead(id: string | number): Promise<LeadVM> {
    const res = await httpRequest.get<ApiResponse<LeadVM>>(`admin/leads/${id}`);

    return res.data;
  }

  public async getLeadDetail(id: string | number): Promise<LeadVM> {
    return await this.getLead(id);
  }

  public async updateLeadStatus(id: string | number, status: LeadStatus): Promise<LeadVM> {
    const res = await httpRequest.patch<ApiResponse<LeadVM>>(`admin/leads/${id}/status`, {
      status,
    });

    return res.data;
  }

  public async updateLead(id: string | number, data: LeadUpdatePayload): Promise<LeadVM> {
    const res = await httpRequest.patch<ApiResponse<LeadVM>>(`admin/leads/${id}`, data);

    return res.data;
  }
}

export default new LeadService();
