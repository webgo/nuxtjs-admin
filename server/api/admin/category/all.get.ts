import { categoryService } from '../../../services/category.service'

export default defineEventHandler(async () => {
  return { code: 200, data: await categoryService.findAll() }
})
