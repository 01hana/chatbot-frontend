import type { VxeGlobalConfig } from 'vxe-table';
import '@fortawesome/fontawesome-free/css/all.min.css';

export const tableConfig: VxeGlobalConfig = {
  table: {
    // border: true,
    round: true,
    filterConfig: { remote: true },
    sortConfig: {
      remote: true,
      trigger: 'cell',
      orders: ['asc', 'desc'],
      iconAsc: 'fa fa-sort-up',
      iconDesc: 'fa fa-sort-down',
    },
    rowConfig: { isHover: true },
    columnConfig: { resizable: true },
    checkboxConfig: { highlight: true, range: true, isShiftKey: true },
  },
  pager: {
    pageSize: 35,
    pageSizes: [35, 50, 100, 150],
    layouts: [
      'PrevJump',
      'PrevPage',
      'Number',
      'NextPage',
      'NextJump',
      'Sizes',
      'FullJump',
      'Total',
    ],
  },
};

export const iconConfig = {
  TABLE_EXPAND_OPEN: 'fa fa-circle-minus',
  TABLE_EXPAND_CLOSE: 'fa fa-circle-plus',
  PAGER_JUMP_PREV: 'fa fa-angles-left',
  PAGER_JUMP_NEXT: 'fa fa-angles-right',
  PAGER_PREV_PAGE: 'fa fa-angle-left',
  PAGER_NEXT_PAGE: 'fa fa-angle-right',
  PAGER_JUMP_MORE: 'fa fa-ellipsis',
};
