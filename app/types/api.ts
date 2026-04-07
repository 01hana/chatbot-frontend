/**
 * Shared API response wrapper types (T-005)
 */

/** Standard single-resource API response envelope. */
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

/** Paginated list response envelope. */
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
  success: boolean
}

/** Standard API error shape. */
export interface ApiError {
  status: number
  message: string
  errors?: Record<string, string[]>
}
