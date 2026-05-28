import ConversationService from '@/services/api/admin/conversations';
import type { ConversationListParams, ConversationSummaryVM } from '~/types/admin';

export const useAdminConversations = defineStore('admin-conversations', () => {
  function toConversationListParams(params: DtParams): ConversationListParams {
    const searches = params.searches ?? {};
    const filters = params.filters ?? {};

    return cleanParams({
      ...toAdminListParams(params),

      sessionId: searches.sessionId,
      dateFrom: searches.dateFrom,
      dateTo: searches.dateTo,
      intentLabel: searches.intentLabel,

      language: firstValue<string>(filters.language),
      status: firstValue<ConversationListParams['status']>(filters.status),
      type: firstValue<string>(filters.type),

      hasFeedback: boolValue(filters.hasFeedback),
      hasConfidential: boolValue(filters.hasConfidential),
      hasPromptInjection: boolValue(filters.hasPromptInjection),
    }) as ConversationListParams;
  }

  async function getTable(params: DtParams): Promise<DtTableResult<ConversationSummaryVM>> {
    const query = toConversationListParams(params);
    const { data: res } = await ConversationService.getTable(query);

    return {
      data: res.data,
      p: res.meta.page,
      total: res.meta.total,
    };
  }

  async function get(id: string) {
    const { data: res } = await ConversationService.get(id);

    return res;
  }

  async function exportCsv(params: DtParams): Promise<{ url: string }> {
    const query = toConversationListParams(params);

    const { data: res } = await ConversationService.export(query);

    return res;
  }

  // async function create(data: Record<string, any>) {
  //   return await ConversationService.create(data);
  // }

  // async function set(id: string, data: Record<string, any>) {
  //   const { data: res } = await ConversationService.set(id, data);

  //   return res;
  // }

  // async function remove({ rows }: Record<string, number | string>) {
  //   const data = { ids: rows };

  //   return await ConversationService.remove(data);
  // }

  return {
    getTable,
    get,
    exportCsv,
    // create,
    // set,
    // remove,
  };
});
