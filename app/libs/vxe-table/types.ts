export type DtSortOrder = 'asc' | 'desc';

export type DtSort = [field: string, order: DtSortOrder] | null;

export interface DtParams {
  p?: number;
  length?: number;
  sort: DtSort;
  searches: Record<string, any>;
  filters: Record<string, any>;
}

export interface DtTableResult<T = any> {
  data: T[];
  p: number;
  total: number;
}
