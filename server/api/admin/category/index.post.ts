import { categoryService } from '../../../services/category.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return { code: 200, data: await categoryService.create(body) }
})
