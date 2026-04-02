import type { StoreGeneric } from 'pinia';

import type { VxeTableInstance, VxeColumnPropTypes, VxeTablePropTypes } from 'vxe-table';
// import { VxePager } from 'vxe-pc-ui';

interface Params {
  p: number | undefined;
  length: number | undefined;
  sort: any[] | null;
  searches: any;
  filters: any;
}

export default class Base {
  protected store: StoreGeneric;
  protected table = {} as VxeTableInstance;
  // private vxePager = {} as InstanceType<typeof VxePager>;

  public loading = shallowRef<boolean>(false);

  public data = shallowRef<VxeTablePropTypes.Data | undefined>();

  public filters = ref<VxeColumnPropTypes.Filters>([]);

  public pager = reactive<Record<string, number | undefined>>({
    p: 1,
    length: 35,
    total: 0,
  });

  public select = reactive<{
    count: number;
    visible: boolean;
  }>({
    count: 0,
    visible: false,
  });

  public isSelected = computed<boolean>(() => this.select.count > 0);
  public isSelectBatch = shallowRef<boolean>(false);

  protected _params = reactive<Params>({
    p: this.pager.p,
    length: this.pager.length,
    sort: null,
    searches: { keyword: '' },
    filters: {},
  });

  // public params = computed(() => {
  //   const ignore = ['searches', 'filters'];

  //   return Object.keys(this._params).reduce((acc, key) => {
  //     const value = this._params[key as keyof Params];

  //     if (ignore.includes(key)) {
  //       if (value && Object.keys(value).length > 0) acc[key as keyof Params] = value;

  //       return acc;
  //     }

  //     acc[key as keyof Params] = value;

  //     return acc;
  //   }, {} as Partial<Params>);
  // });

  public params = computed(() => this._params);

  private defaultSort: [string, 'asc' | 'desc'] | null = null;

  constructor(store: StoreGeneric) {
    this.store = store;

    Object.defineProperty(this._params, 'p', { get: () => this.pager.p });
    Object.defineProperty(this._params, 'length', { get: () => this.pager.length });

    onBeforeUnmount(() => this.reset());
  }

  public reset = async () => {
    await this.setData(undefined);

    this.resetSort();
    this.resetSearch();
    this.resetFilter();
    this.setPager(1, 0, 35);
  };

  public resetDt = () => {
    this.setData(undefined);

    this.resetSearch();
    this.resetFilter();

    this.setPager(1);

    this.store.getTable(this.params.value);
  };

  protected resetSearch = () => {
    this._params.searches = {};
  };

  protected resetFilter = () => {
    this.table.clearFilter();

    this._params.filters = {};
  };

  private readonly resetSort = () => {
    this._params.sort = this.defaultSort;
  };

  protected resetSelect = () => {
    this.select.count = 0;

    this.table.clearCheckboxRow();
  };

  public setTableRef = (ref?: VxeTableInstance | null) => {
    if (!ref) return;

    this.table = ref;
  };

  // public setPagerRef = (ref: InstanceType<typeof VxePager> | null) => {
  //   if (!ref) return;

  //   this.vxePager = ref;
  // };

  protected setLoading = (state: boolean) => {
    this.loading.value = state;
  };

  protected setSwitchLoading = (id: number | string, state: boolean) => {
    if (!this.data.value) return;

    let row = this.data.value.find(row => row.id === id);

    if (!row) return;

    row = toReactive(row);

    row.switchLoading = state ? 'grey-300' : false;
  };

  private readonly setSwitchLoadingModel = async (data: VxeTablePropTypes.Data | undefined) => {
    if (!data) return;

    data.forEach((row: Record<string, any>) => {
      if (row?.id && Object.hasOwn(row, 'status')) row.switchLoading = false;
    });
  };

  protected setSwitchStatus = (id: number | string, state: boolean) => {
    if (!this.data.value) return;

    let row = this.data.value.find(row => row.id === id);

    if (!row) return;

    row = toReactive(row);

    row.status = state;
  };

  protected setData = async (data: VxeTablePropTypes.Data | undefined) => {
    // await this.setSwitchLoadingModel(data);

    this.data.value = data;
  };

  public updateDtRowData = (res: VxeTablePropTypes.Row) => {
    if (!this.data.value) return;

    const row = this.data.value.find(item => item.id === res.id);

    if (!row) return;

    const rows = toReactive(row);

    this.table.setRow(rows, res);
  };

  public setSort = (field: string, order: 'asc' | 'desc') => {
    this._params.sort = [field, order];

    if (!this.defaultSort) this.defaultSort = [field, order];
  };

  protected setDtSort = async () => {
    const [firstSort] = this.table.getSortColumns();

    if (firstSort?.field && firstSort?.order) {
      this.table.sort(firstSort.field, firstSort.order);

      return;
    }

    const [field, order] = this._params.sort ?? [null, null];

    if (field && order) {
      this.table.sort(field, order);
    }
  };

  protected setPager = (p: number, total?: number | null, length?: number) => {
    this.pager.p = p;
    this.pager.total = total ?? this.pager.total;
    this.pager.length = length ?? this.pager.length;
  };

  public setColumnFixed = (field: VxeColumnPropTypes.Field, fixed: VxeColumnPropTypes.Fixed) => {
    this.table.setColumnFixed(field, fixed);
  };

  public getSelectedItems = () => {
    return this.table
      .getCheckboxRecords()
      .slice(0, 6)
      .map(record => record?.name ?? record?.title);
  };
}
