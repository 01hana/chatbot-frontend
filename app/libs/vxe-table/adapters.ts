import type { DtParams } from './types';
import type { AdminListParams } from '~/types/admin';

export function firstValue<T = unknown>(value: unknown): T | undefined {
  if (Array.isArray(value)) return value[0] as T;
  if (value === '' || value === null || value === undefined) return undefined;
  return value as T;
}

export function boolValue(value: unknown): boolean | undefined {
  const v = firstValue(value);

  if (v === true || v === 'true') return true;
  if (v === false || v === 'false') return false;

  return undefined;
}

export function cleanParams<T extends Record<string, any>>(params: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      if (value === undefined) return false;
      if (value === null) return false;
      if (value === '') return false;
      return true;
    }),
  ) as Partial<T>;
}

export function toAdminListParams(params: DtParams): AdminListParams {
  return cleanParams({
    page: params.p ?? 1,
    pageSize: params.length ?? 35,
    keyword: params.searches?.keyword,
    sortBy: params.sort?.[0],
    sortOrder: params.sort?.[1],
  }) as AdminListParams;
}
