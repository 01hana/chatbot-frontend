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
  public async getTable(
    params: ConversationListParams,
  ): Promise<PaginatedResponse<ConversationSummaryVM>> {
    const res = await httpRequest.get<ApiResponse<PaginatedResponse<ConversationSummaryVM>>>(
      'admin/conversations',
      params,
    );

    return res.data;
  }

  public async get(id: number | string): Promise<ConversationDetailVM> {
    const res = await httpRequest.get<ApiResponse<ConversationDetailVM>>(
      `admin/conversations/${id}`,
    );

    return res.data;
  }

  public async export(params: ConversationListParams): Promise<{ url: string }> {
    const res = await httpRequest.post<ApiResponse<{ url: string }>>(
      'admin/conversations/export',
      params,
    );

    return res.data;
  }
}

export default new ConversationService();
