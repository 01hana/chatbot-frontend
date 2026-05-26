/**
 * Admin Conversations API Service (T-051)
 *
 * GET  /admin/conversations          → PaginatedResponse<ConversationSummaryVM>
 * GET  /admin/conversations/:id      → ConversationDetailVM
 * POST /admin/conversations/export   → { url: string }
 */

import httpRequest from '@/services/index';
import type {
  ConversationSummaryVM,
  ConversationDetailVM,
  ConversationListParams,
} from '~/types/admin';
import type { PaginatedResponse, ApiResponse } from '~/types/api';

class ConversationService {
  public getTable(params: ConversationListParams) {
    return httpRequest.get<ApiResponse<PaginatedResponse<ConversationSummaryVM>>>(
      'admin/conversations',
      params,
    );
  }

  public get(id: number | string) {
    return httpRequest.get<ApiResponse<ConversationDetailVM>>(`admin/conversations/${id}`);
  }

  public export(params: ConversationListParams) {
    return httpRequest.post<ApiResponse<{ url: string }>>('admin/conversations/export', params);
  }
}

export default new ConversationService();
