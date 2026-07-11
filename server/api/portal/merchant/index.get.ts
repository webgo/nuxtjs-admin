import { merchantService } from '../../../services/merchant.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const params: any = { page: Number(query.page) || 1, pageSize: Number(query.pageSize) || 10 }
  if (query.name) params.name = query.name
  if (query.categoryId !== undefined) params.categoryId = Number(query.categoryId)
  if (query.keyword) params.keyword = query.keyword
  return { code: 200, data: await merchantService.listPublic(params) }
})
