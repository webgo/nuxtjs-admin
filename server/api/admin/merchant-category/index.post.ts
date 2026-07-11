import { merchantCategoryService } from '../../../services/merchant-category.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return { code: 200, data: await merchantCategoryService.create(body) }
})
