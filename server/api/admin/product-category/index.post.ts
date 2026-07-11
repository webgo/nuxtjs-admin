import { productCategoryService } from '../../../services/product-category.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return { code: 200, data: await productCategoryService.create(body) }
})
