import { productService } from '../../../services/product.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const params: any = { page: Number(query.page) || 1, pageSize: Number(query.pageSize) || 10, merchantId: Number(query.merchantId) }
  if (query.categoryId !== undefined) params.categoryId = Number(query.categoryId)
  return { code: 200, data: await productService.listPublic(params) }
})
