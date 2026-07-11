import { productService } from '../../../services/product.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const params: any = { page: Number(query.page) || 1, pageSize: Number(query.pageSize) || 10 }
  if (query.merchantId !== undefined) params.merchantId = Number(query.merchantId)
  if (query.categoryId !== undefined) params.categoryId = Number(query.categoryId)
  if (query.name) params.name = query.name
  if (query.status !== undefined) params.status = Number(query.status)
  const data = await productService.list(params)
  return { code: 200, data }
})
