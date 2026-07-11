import { productCategoryService } from '../../../services/product-category.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  await productCategoryService.delete(id)
  return { code: 200, msg: '删除成功' }
})
