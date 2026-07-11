import { productCategoryService } from '../../../services/product-category.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const params: any = { page: Number(query.page) || 1, pageSize: Number(query.pageSize) || 10 }
  if (query.merchantId !== undefined) params.merchantId = Number(query.merchantId)
  if (query.name) params.name = query.name
  return { code: 200, data: await productCategoryService.list(params) }
})
