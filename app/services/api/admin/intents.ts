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
      'admin/intents',
      params,
    );

    return res.data;
  }

  public async getIntent(id: string | number): Promise<IntentVM> {
    const res = await httpRequest.get<ApiResponse<IntentVM>>(`admin/intents/${id}`);

    return res.data;
  }

  public async createIntent(data: IntentCreatePayload): Promise<IntentVM> {
    const res = await httpRequest.post<ApiResponse<IntentVM>>('admin/intents', data);

    return res.data;
  }

  public async updateIntent(
    id: string | number,
    data: IntentUpdatePayload,
  ): Promise<IntentVM> {
    const res = await httpRequest.patch<ApiResponse<IntentVM>>(`admin/intents/${id}`, data);

    return res.data;
  }

  public async deleteIntent(id: string | number): Promise<void> {
    await httpRequest.delete<ApiResponse<null>>(`admin/intents/${id}`);
  }

  public async toggleIntent(id: string | number, enabled: boolean): Promise<IntentVM> {
    const res = await httpRequest.patch<ApiResponse<IntentVM>>(`admin/intents/${id}/toggle`, {
      enabled,
    });

    return res.data;
  }

  public async previewIntent(testInput: string): Promise<IntentPreviewResult> {
    const res = await httpRequest.post<ApiResponse<IntentPreviewResult>>(
      'admin/intents/preview',
      { testInput },
    );

    return res.data;
  }
}

export default new IntentService();
