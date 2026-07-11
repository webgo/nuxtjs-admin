import { merchantService } from '../../../services/merchant.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const params: any = { page: Number(query.page) || 1, pageSize: Number(query.pageSize) || 10 }
  if (query.name) params.name = query.name
  if (query.categoryId !== undefined) params.categoryId = Number(query.categoryId)
  if (query.regionId !== undefined) params.regionId = Number(query.regionId)
  if (query.status !== undefined) params.status = Number(query.status)
  if (query.level !== undefined) params.level = Number(query.level)
  if (query.isFeatured !== undefined) params.isFeatured = Number(query.isFeatured)
  if (query.keyword) params.keyword = query.keyword
  return { code: 200, data: await merchantService.list(params) }
})
