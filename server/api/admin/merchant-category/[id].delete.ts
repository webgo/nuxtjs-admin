import { merchantCategoryService } from '../../../services/merchant-category.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  await merchantCategoryService.delete(id)
  return { code: 200, msg: '删除成功' }
})
