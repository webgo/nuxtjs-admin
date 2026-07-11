import { productService } from '../../../services/product.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  await productService.delete(id)
  return { code: 200, msg: '删除成功' }
})
