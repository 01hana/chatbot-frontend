import IntentService from '~/services/api/admin/intent';
import type { DtParams, DtTableResult } from '~/libs/vxe-table';
import { boolValue, cleanParams, firstValue, toAdminListParams } from '~/libs/vxe-table/adapters';
import type {
  IntentCreatePayload,
  IntentListParams,
  IntentSummaryVM,
  IntentUpdatePayload,
  IntentVM,
} from '~/types/admin';

type RemovePayload = string | number | { rows?: Array<string | number>; id?: string | number };

export const useAdminIntent = defineStore('admin-intent', () => {
  function resolveRemoveIds(payload: RemovePayload) {
    if (typeof payload === 'string' || typeof payload === 'number') return [payload];
    if (Array.isArray(payload.rows)) return payload.rows;
    if (payload.id) return [payload.id];
    return [];
  }

  function toIntentListParams(params: DtParams): IntentListParams {
    const filters = params.filters ?? {};

    return cleanParams({
      ...toAdminListParams(params),
      enabled: boolValue(filters.enabled),
      priority: firstValue<number>(filters.priority),
      status:
        boolValue(filters.enabled) === undefined
          ? firstValue<IntentListParams['status']>(filters.status)
          : undefined,
    }) as IntentListParams;
  }

  function normalizeIntent(row: IntentVM): IntentSummaryVM {
    const enabled = row.enabled ?? row.status === 'active';

    return {
      ...row,
      enabled,
      status: row.status ?? (enabled ? 'active' : 'inactive'),
      priority: row.priority ?? row.sortOrder ?? 0,
      sortOrder: row.sortOrder ?? row.priority ?? 0,
      keywords: row.keywords ?? row.examples ?? [],
    };
  }

  async function getTable(params: DtParams): Promise<DtTableResult<IntentSummaryVM>> {
    const query = toIntentListParams(params);
    const res = await IntentService.listIntents(query);

    return {
      data: res.data,
      p: res.meta.page,
      total: res.meta.total,
    };
  }

  async function get(id: string | number) {
    return normalizeIntent(await IntentService.getIntent(id));
  }

  async function create(data: IntentCreatePayload) {
    return normalizeIntent(await IntentService.createIntent(data));
  }

  async function update(id: string | number, data: IntentUpdatePayload) {
    return normalizeIntent(await IntentService.updateIntent(id, data));
  }

  async function deleteIntent(id: string | number) {
    await IntentService.deleteIntent(id);
  }

  async function remove(payload: RemovePayload) {
    const ids = resolveRemoveIds(payload);
    await Promise.all(ids.map(id => IntentService.deleteIntent(id)));
  }

  async function actions(data: Record<string, any>) {
    await IntentService.actions(data);
  }

  async function previewIntent(testInput: string) {
    return await IntentService.previewIntent(testInput);
  }

  return {
    getTable,
    get,
    create,
    update,
    delete: deleteIntent,
    remove,
    actions,
    previewIntent,
  };
});
