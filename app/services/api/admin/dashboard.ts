/**
 * Admin Dashboard API Service (T-051)
 *
 * GET /admin/dashboard → DashboardStatsVM
 */

import { createAdminClient } from './client'
import type { DashboardStatsVM } from '~/types/admin'
import type { ApiResponse } from '~/types/api'

/**
 * Fetch aggregated KPI stats for the admin dashboard.
 * GET admin/dashboard
 */
export async function getDashboardStats(): Promise<DashboardStatsVM> {
  const client = createAdminClient()
  const res = await client<ApiResponse<DashboardStatsVM>>('admin/dashboard', {
    method: 'GET',
  })
  return res.data
}
