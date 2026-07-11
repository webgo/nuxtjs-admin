import type { ApiResponse } from '#shared/types/api'

export function success<T>(data: T, msg = 'success'): ApiResponse<T> {
  return { code: 200, msg, data }
}

export function fail(msg: string, code = 500): ApiResponse<null> {
  return { code, msg, data: null }
}

export function paginate<T>(
  list: T[],
  total: number,
  page: number,
  pageSize: number,
): ApiResponse<{ list: T[]; total: number; page: number; pageSize: number }> {
  return success({ list, total, page, pageSize })
}
