import KnowledgeService from '~/services/api/admin/knowledge';
import type { DtParams, DtTableResult } from '~/libs/vxe-table';
import { cleanParams, firstValue, toAdminListParams } from '~/libs/vxe-table/adapters';
import type {
  KnowledgeCreatePayload,
  KnowledgeEntrySummaryVM,
  KnowledgeListParams,
  KnowledgeStatus,
  KnowledgeUpdatePayload,
  KnowledgeVisibilityUpdateValue,
} from '~/types/admin';

type RemovePayload = string | number | { rows?: Array<string | number>; id?: string | number };

export const useAdminKnowledge = defineStore('admin-knowledge', () => {
  const toast = useAppToast();
  const categoryItems = ref<{ label: string; value: string }[]>([]);

  function toKnowledgeListParams(params: DtParams): KnowledgeListParams {
    const searches = params.searches ?? {};
    const filters = params.filters ?? {};

    return cleanParams({
      ...toAdminListParams(params),
      startDate: searches.startDate ?? searches.dateFrom,
      endDate: searches.endDate ?? searches.dateTo,
      category: firstValue<string>(filters.category),
      status: firstValue<KnowledgeStatus>(filters.status),
    }) as KnowledgeListParams;
  }

  function resolveRemoveIds(payload: RemovePayload) {
    if (typeof payload === 'string' || typeof payload === 'number') return [payload];
    if (Array.isArray(payload.rows)) return payload.rows;
    if (payload.id) return [payload.id];
    return [];
  }

  async function getTable(params: DtParams): Promise<DtTableResult<KnowledgeEntrySummaryVM>> {
    const query = toKnowledgeListParams(params);
    const res = await KnowledgeService.listKnowledge(query);

    return {
      data: res.data,
      p: res.meta.page,
      total: res.meta.total,
    };
  }

  async function getFilters(filterColumns: string[]) {
    if (!filterColumns.length) return;

    const res = await KnowledgeService.getFilters();

    categoryItems.value = res.category;

    return res;
  }

  async function get(id: string | number) {
    return await KnowledgeService.getKnowledgeEntry(id);
  }

  async function create(data: KnowledgeCreatePayload) {
    return await KnowledgeService.createKnowledge(data);
  }

  async function update(id: string | number, data: KnowledgeUpdatePayload) {
    return await KnowledgeService.updateKnowledge(id, data);
  }

  async function updateVisibility(
    id: string | number,
    visibility: KnowledgeVisibilityUpdateValue,
  ) {
    return await KnowledgeService.updateKnowledgeVisibility(id, visibility);
  }

  async function publish(id: string | number) {
    return await KnowledgeService.publishKnowledge(id);
  }

  async function archive(id: string | number) {
    return await KnowledgeService.archiveKnowledge(id);
  }

  async function remove(payload: RemovePayload) {
    const ids = resolveRemoveIds(payload);

    if (!ids.length) return;

    await Promise.all(ids.map(id => KnowledgeService.deleteKnowledge(id)));
    toast.success('刪除成功');
  }

  return {
    categoryItems,

    getTable,
    getFilters,
    get,
    create,
    update,
    updateVisibility,
    publish,
    archive,
    remove,
    getVersionHistory: KnowledgeService.getVersionHistory.bind(KnowledgeService),
    restoreVersion: KnowledgeService.restoreVersion.bind(KnowledgeService),
    importKnowledge: KnowledgeService.importKnowledge.bind(KnowledgeService),
  };
});
