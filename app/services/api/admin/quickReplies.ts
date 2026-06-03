/**
 * Admin Quick Replies API Service (T-058)
 */

import httpRequest from '@/services/index';
import type {
  QuickReplyCreatePayload,
  QuickReplyUpdatePayload,
  QuickReplyVM,
} from '~/types/admin';
import type { ApiResponse } from '~/types/api';

class QuickReplyService {
  public async listQuickReplies(): Promise<QuickReplyVM[]> {
    const res = await httpRequest.get<ApiResponse<QuickReplyVM[]>>('admin/quick-replies');

    return res.data;
  }

  public async createQuickReply(data: QuickReplyCreatePayload): Promise<QuickReplyVM> {
    const res = await httpRequest.post<ApiResponse<QuickReplyVM>>('admin/quick-replies', data);

    return res.data;
  }

  public async updateQuickReply(
    id: string | number,
    data: QuickReplyUpdatePayload,
  ): Promise<QuickReplyVM> {
    const res = await httpRequest.patch<ApiResponse<QuickReplyVM>>(
      `admin/quick-replies/${id}`,
      data,
    );

    return res.data;
  }

  public async deleteQuickReply(id: string | number): Promise<void> {
    await httpRequest.delete<ApiResponse<null>>(`admin/quick-replies/${id}`);
  }

  public async reorderQuickReplies(ids: string[]): Promise<QuickReplyVM[]> {
    const res = await httpRequest.post<ApiResponse<QuickReplyVM[]>>(
      'admin/quick-replies/reorder',
      { ids },
    );

    return res.data;
  }
}

export default new QuickReplyService();
