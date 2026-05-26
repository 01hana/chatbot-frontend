/**
 * app/features/admin/composables/useLeads.ts (T-055)
 *
 * Domain store for Lead API state.
 * Does NOT handle route query parsing — use useAdminListQuery for that.
 */

import { listLeads, getLeadDetail, updateLead as updateLeadApi } from '~/services/api/admin/leads'
import type { LeadVM, LeadListParams, LeadUpdatePayload } from '~/types/admin'

export function useLeads() {
  const leads = ref<LeadVM[]>([])
  const lead = ref<LeadVM | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)

  async function fetchLeads(params?: LeadListParams): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await listLeads(params)
      leads.value = res.data
      total.value = res.meta.total
    } catch (e) {
      error.value = e instanceof Error ? e.message : '載入失敗'
    } finally {
      loading.value = false
    }
  }

  async function fetchLeadDetail(id: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      lead.value = await getLeadDetail(id)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '載入失敗'
    } finally {
      loading.value = false
    }
  }

  async function updateLead(id: string, data: LeadUpdatePayload): Promise<LeadVM | null> {
    try {
      const updated = await updateLeadApi(id, data)
      lead.value = updated
      return updated
    } catch (e) {
      error.value = e instanceof Error ? e.message : '更新失敗'
      return null
    }
  }

  return { leads, lead, loading, error, total, fetchLeads, fetchLeadDetail, updateLead }
}
