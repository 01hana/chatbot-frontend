/**
 * Admin Intents API Service (T-058)
 */

import httpRequest from '@/services/index';
import type {
  IntentCreatePayload,
  IntentListParams,
  IntentPreviewResult,
  IntentUpdatePayload,
  IntentVM,
} from '~/types/admin';
import type { ApiResponse, PaginatedResponse } from '~/types/api';

class IntentService {
  public async listIntents(params?: IntentListParams): Promise<PaginatedResponse<IntentVM>> {
    const res = await httpRequest.get<ApiResponse<PaginatedResponse<IntentVM>>>(
      'admin/intent',
      params,
    );

    return res.data;
  }

  public async getIntent(id: string | number): Promise<IntentVM> {
    const res = await httpRequest.get<ApiResponse<IntentVM>>(`admin/intent/${id}`);

    return res.data;
  }

  public async createIntent(data: IntentCreatePayload): Promise<IntentVM> {
    const res = await httpRequest.post<ApiResponse<IntentVM>>('admin/intent', data);

    return res.data;
  }

  public async updateIntent(id: string | number, data: IntentUpdatePayload): Promise<IntentVM> {
    const res = await httpRequest.patch<ApiResponse<IntentVM>>(`admin/intent/${id}`, data);

    return res.data;
  }

  public async deleteIntent(id: string | number): Promise<void> {
    await httpRequest.delete<ApiResponse<null>>(`admin/intent/${id}`);
  }

  public async actions(data: Record<string, any>) {
    const res = await httpRequest.patch('admin/intent/batch', data);

    return res.data;
  }

  public async previewIntent(testInput: string): Promise<IntentPreviewResult> {
    const res = await httpRequest.post<ApiResponse<IntentPreviewResult>>('admin/intent/preview', {
      testInput,
    });

    return res.data;
  }
}

export default new IntentService();
