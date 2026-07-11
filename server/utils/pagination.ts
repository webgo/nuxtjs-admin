export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginationQuery {
  page?: string | string[]
  pageSize?: string | string[]
}

export function parsePagination(query: PaginationQuery): PaginationParams {
  const page = Math.max(1, Number(query.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 10))
  return { page, pageSize }
}

export function paginateArgs(params: PaginationParams): { skip: number; take: number } {
  return {
    skip: (params.page - 1) * params.pageSize,
    take: params.pageSize,
  }
}
