import { defineStore } from 'pinia';
import LeadService from '~/services/api/admin/leads';
import type { DtParams, DtTableResult } from '~/libs/vxe-table';
import { cleanParams, firstValue, toAdminListParams } from '~/libs/vxe-table/adapters';
import type { LeadListParams, LeadStatus, LeadSummaryVM, LeadUpdatePayload } from '~/types/admin';

export const useAdminLeads = defineStore('admin-leads', () => {
  function toLeadListParams(params: DtParams): LeadListParams {
    const searches = params.searches ?? {};
    const filters = params.filters ?? {};

    return cleanParams({
      ...toAdminListParams(params),
      startDate: searches.startDate ?? searches.dateFrom,
      endDate: searches.endDate ?? searches.dateTo,
      status: firstValue<LeadStatus>(filters.status),
    }) as LeadListParams;
  }

  async function getTable(params: DtParams): Promise<DtTableResult<LeadSummaryVM>> {
    const query = toLeadListParams(params);
    const res = await LeadService.listLeads(query);

    return {
      data: res.data,
      p: res.meta.page,
      total: res.meta.total,
    };
  }

  async function get(id: string | number) {
    return await LeadService.getLeadDetail(id);
  }

  async function setStatus(id: string | number, status: LeadStatus) {
    return await LeadService.updateLeadStatus(id, status);
  }

  async function update(id: string | number, payload: LeadUpdatePayload) {
    return await LeadService.updateLead(id, payload);
  }

  return {
    getTable,
    get,
    setStatus,
    update,
  };
});
