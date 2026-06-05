/**
 * app/features/admin/composables/useAdminStatus.ts
 *
 * Centralised status label and badge-colour mapping for admin entities.
 * Used by AppStatusBadge and any admin page that needs to display status text.
 */

export type AdminBadgeColor = 'success' | 'neutral' | 'warning' | 'error' | 'info'

const GLOBAL_COLOR_MAP: Record<string, AdminBadgeColor> = {
  // success
  active: 'success',
  resolved: 'success',
  qualified: 'success',
  published: 'success',
  // neutral
  inactive: 'neutral',
  archived: 'neutral',
  closed: 'neutral',
  disabled: 'neutral',
  // warning
  pending: 'warning',
  draft: 'warning',
  in_progress: 'warning',
  handoff: 'warning',
  // error
  error: 'error',
  failed: 'error',
  // info
  open: 'info',
  new: 'info',
  contacted: 'info',
}

const GLOBAL_LABEL_MAP: Record<string, string> = {
  active: 'Active',
  resolved: '已解決',
  qualified: '已評估',
  published: '已發佈',
  inactive: '停用',
  archived: '已封存',
  closed: '已關閉',
  pending: '待處理',
  draft: '草稿',
  disabled: '已停用',
  in_progress: '處理中',
  handoff: '轉人工',
  error: '錯誤',
  failed: '失敗',
  open: '開啟',
  new: '新增',
  contacted: '已聯繫',
}

const TICKET_LABEL_MAP: Record<string, string> = {
  open: '開啟',
  in_progress: '處理中',
  resolved: '已解決',
  closed: '已關閉',
}

const TICKET_PRIORITY_LABEL_MAP: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
}

const LEAD_LABEL_MAP: Record<string, string> = {
  new: '新增',
  contacted: '已聯繫',
  qualified: '已評估',
  closed: '已關閉',
}

export function useAdminStatus() {
  function getAdminStatusColor(status: string): AdminBadgeColor {
    return GLOBAL_COLOR_MAP[status] ?? 'neutral'
  }

  function getAdminStatusLabel(status: string): string {
    return GLOBAL_LABEL_MAP[status] ?? status
  }

  function getTicketStatusLabel(status: string): string {
    return TICKET_LABEL_MAP[status] ?? getAdminStatusLabel(status)
  }

  function getLeadStatusLabel(status: string): string {
    return LEAD_LABEL_MAP[status] ?? getAdminStatusLabel(status)
  }

  function getTicketPriorityLabel(priority: string): string {
    return TICKET_PRIORITY_LABEL_MAP[priority] ?? priority
  }

  return {
    getAdminStatusColor,
    getAdminStatusLabel,
    getTicketStatusLabel,
    getLeadStatusLabel,
    getTicketPriorityLabel,
  }
}
