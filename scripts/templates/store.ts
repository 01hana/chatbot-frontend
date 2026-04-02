import __PascalEntity__Service from '@/services/api/__ENTITY__';

export const use__PascalEntity__ = defineStore('__ENTITY__', () => {
  async function getTable(params: Record<string, any>) {
    return __PascalEntity__Service.getTable(params);
  }

  async function getFilters(filterColumns: string[]) {
    if (!filterColumns.length) return;

    const { data: res } = await __PascalEntity__Service.getFilters();

    return res;
  }

  async function get(id: string) {
    return await __PascalEntity__Service.get(id);
  }

  async function create(data: Record<string, any>) {
    return await __PascalEntity__Service.create(data);
  }

  async function set(id: string, data: Record<string, any>) {
    const { data: res } = await __PascalEntity__Service.set(id, data);

    return res;
  }

  async function remove({ rows }: Record<string, number | string>) {
    const data = { ids: rows };

    return await __PascalEntity__Service.remove(data);
  }

  return {
    getTable,
    getFilters,
    get,
    create,
    set,
    remove,
  };
});
