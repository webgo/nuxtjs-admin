import { merchantCategoryService } from '../../../services/merchant-category.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  return { code: 200, data: await merchantCategoryService.update(id, body) }
})
