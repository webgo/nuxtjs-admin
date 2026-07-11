import { merchantCategoryService } from '../../../services/merchant-category.service'

export default defineEventHandler(async () => {
  return { code: 200, data: await merchantCategoryService.findAll() }
})
