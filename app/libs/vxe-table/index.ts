import type { InjectionKey } from 'vue';
import type { VxePagerEvents } from 'vxe-pc-ui';
import type { StoreGeneric } from 'pinia';
import Base from './base';

export class DtUtils extends Base {
  public static readonly key = Symbol('DtUtils') as InjectionKey<DtUtils & Base>;

  public manualState = ref('');

  constructor(store: StoreGeneric) {
    super(store);

    this.getTableSubscribe();
  }

  private readonly getTableSubscribe = () => {
    this.store.$onAction(({ name, args, after }) => {
      const isDtAction = name === 'getTable';
      const isFilterAction = name === 'getFilters';

      if (isFilterAction) after(res => this.setFilter(args[0], res));

      if (isDtAction) {
        this.resetSelect();

        this.setLoading(true);

        after(res => this.setTable(res));
      }
    });
  };

  public setFilter = (filterColumns: string[], results: Record<string, Record<string, any>[]>) => {
    nextTick(() => {
      Object.entries(results).forEach(async ([key, value]) => {
        if (!filterColumns.includes(key)) return;

        this.table.setFilter(key, value);
      });
    });
  };

  public setTable = (results: any) => {
    if (!results) return;

    const { data, p, total } = results;

    this.setData(data);
    this.setPager(p, total);
    this.setDtSort();

    this.setLoading(false);
  };

  public pageChange: VxePagerEvents.PageChange = ({ currentPage, pageSize }) => {
    this.setPager(currentPage, null, pageSize);

    this.store.getTable(this.params.value);
  };

  public selectVisible = () => {
    const column = this.table.getColumnByField('select');

    if (!column) return;

    this.isSelectBatch.value = !this.isSelectBatch.value;

    if (!this.isSelectBatch.value) {
      this.table.hideColumn(column);

      this.resetSelect();

      return;
    }

    this.table.showColumn(column);
  };

  public searchSubmit = (data: Record<string, any>) => {
    this.resetSearch();

    this.setPager(1);

    this._params.searches.keyword = data.keyword;

    this.store.getTable(this.params.value);
  };

  public advancedSearchSubmit = (data: Record<string, any>) => {
    this.resetSearch();

    this.setPager(1);

    const dataExist = data && Object.keys(data).length > 0;

    if (dataExist) {
      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;

        this._params.searches[key] = value;
      });
    }

    this.store.getTable(this.params.value);
  };

  public sortChange = ({ column }: any) => {
    if (!column.sortable) return;

    const { field, order } = column;

    if (!field || !order) return;

    this._params.sort = [field, order];

    this.store.getTable(this.params.value);
  };

  public filterChange = ({ field, values }: any) => {
    this.setPager(1);

    this._params.filters[field] = values;

    if (values.length <= 0) delete this._params.filters[field];

    this.store.getTable(this.params.value);
  };

  public selectChange = (row: any) => {
    this.select.count = row.records.length;
  };

  public selectRangeChange = (row: any) => {
    this.select.count = row.records.length;
  };

  public remove = async (id?: number | string | null) => {
    if (!id) return;

    const params = { rows: [id] };

    await this.store.remove(params);

    this.store.getTable(this.params.value);
  };

  public removeBatch = async () => {
    if (this.select.count <= 0) return;

    const records = this.table.getCheckboxRecords();

    const rows = records.map(item => item.id);

    const params = { rows };

    await this.store.remove(params);

    this.resetSelect();

    this.store.getTable(this.params.value);
  };

  public actionBatch = async (value: string | boolean) => {
    if (this.select.count <= 0) return;

    const records = this.table.getCheckboxRecords();

    const rows = records.map(item => item.id);

    const data = { status: value, ids: rows };

    await this.store.actions(data);

    await this.store.getTable(this.params.value);

    this.resetSelect();
  };

  // public actionStatus = async (id: number | string, value: boolean) => {
  //   this.setSwitchLoading(id, true);

  //   const data = { rows: [id], status: value };

  //   await this.store
  //     .actions(data)
  //     .catch((error: any) => {
  //       this.setSwitchStatus(id, !value);

  //       return Promise.reject(error);
  //     })
  //     .finally(() => this.setSwitchLoading(id, false));
  // };

  public manualHasEditStatus = (row: any) => {
    return this.table.isEditByRow(row);
  };

  public manualAddRow = async (record: Record<string, any>) => {
    const { row: newRow } = await this.table.insert(record);

    this.manualState.value = 'isAdd';

    this.table.setEditRow(newRow);
  };

  public manualEditRow = (row: any) => {
    this.manualState.value = 'isEdit';

    this.table.setEditRow(row);
  };

  public manualSaveRow = async (row: any) => {
    this.table.clearEdit();

    this.manualState.value === 'isAdd' || !row.id
      ? await this.store.create(row)
      : await this.store.set(row.id, row);

    this.store.getTable(this.params.value);
  };

  public manualCancelRow = (row: any) => {
    this.table.clearEdit(row);
  };
}
