/**
 * Admin Knowledge API Service (T-058)
 */

import httpRequest from '@/services/index';
import type {
  KnowledgeCreatePayload,
  KnowledgeEntryVM,
  KnowledgeFiltersVM,
  KnowledgeImportResult,
  KnowledgeListParams,
  KnowledgeRevisionVM,
  KnowledgeUpdatePayload,
  KnowledgeVisibilityUpdateValue,
} from '~/types/admin';
import type { ApiResponse, PaginatedResponse } from '~/types/api';

class KnowledgeService {
  public async listKnowledge(
    params?: KnowledgeListParams,
  ): Promise<PaginatedResponse<KnowledgeEntryVM>> {
    const res = await httpRequest.get<ApiResponse<PaginatedResponse<KnowledgeEntryVM>>>(
      'admin/knowledge',
      params,
    );

    return res.data;
  }

  public async getFilters(): Promise<KnowledgeFiltersVM> {
    const res = await httpRequest.get<ApiResponse<KnowledgeFiltersVM>>('admin/knowledge/filters');

    return res.data;
  }

  public async getKnowledgeEntry(id: string | number): Promise<KnowledgeEntryVM> {
    const res = await httpRequest.get<ApiResponse<KnowledgeEntryVM>>(`admin/knowledge/${id}`);

    return res.data;
  }

  public async createKnowledge(data: KnowledgeCreatePayload): Promise<KnowledgeEntryVM> {
    const res = await httpRequest.post<ApiResponse<KnowledgeEntryVM>>('admin/knowledge', data);

    return res.data;
  }

  public async updateKnowledge(
    id: string | number,
    data: KnowledgeUpdatePayload,
  ): Promise<KnowledgeEntryVM> {
    const res = await httpRequest.patch<ApiResponse<KnowledgeEntryVM>>(
      `admin/knowledge/${id}`,
      data,
    );

    return res.data;
  }

  public async updateKnowledgeVisibility(
    id: string | number,
    visibility: KnowledgeVisibilityUpdateValue,
  ): Promise<KnowledgeEntryVM> {
    const res = await httpRequest.patch<ApiResponse<KnowledgeEntryVM>>(
      `admin/knowledge/${id}/visibility`,
      { visibility },
    );

    return res.data;
  }

  public async publishKnowledge(id: string | number): Promise<KnowledgeEntryVM> {
    const res = await httpRequest.post<ApiResponse<KnowledgeEntryVM>>(
      `admin/knowledge/${id}/publish`,
    );

    return res.data;
  }

  public async archiveKnowledge(id: string | number): Promise<KnowledgeEntryVM> {
    const res = await httpRequest.post<ApiResponse<KnowledgeEntryVM>>(
      `admin/knowledge/${id}/archive`,
    );

    return res.data;
  }

  public async deleteKnowledge(id: string | number): Promise<void> {
    await httpRequest.delete<ApiResponse<null>>(`admin/knowledge/${id}`);
  }

  public async getVersionHistory(id: string | number): Promise<KnowledgeRevisionVM[]> {
    const res = await httpRequest.get<ApiResponse<KnowledgeRevisionVM[]>>(
      `admin/knowledge/${id}/versions`,
    );

    return res.data;
  }

  public async restoreVersion(
    id: string | number,
    versionId: string | number,
  ): Promise<KnowledgeEntryVM> {
    const res = await httpRequest.post<ApiResponse<KnowledgeEntryVM>>(
      `admin/knowledge/${id}/versions/${versionId}/restore`,
    );

    return res.data;
  }

  public async importKnowledge(formData: FormData): Promise<KnowledgeImportResult> {
    const res = await httpRequest.post<ApiResponse<KnowledgeImportResult>>(
      'admin/knowledge/import',
      formData,
    );

    return res.data;
  }
}

export default new KnowledgeService();
