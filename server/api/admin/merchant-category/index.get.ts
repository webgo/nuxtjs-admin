import { merchantCategoryService } from '../../../services/merchant-category.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  if (query.all !== undefined) return { code: 200, data: await merchantCategoryService.findAll() }
  const params: any = { page: Number(query.page) || 1, pageSize: Number(query.pageSize) || 10 }
  return { code: 200, data: await merchantCategoryService.list(params) }
})
