import { productService } from '../../../services/product.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  return { code: 200, data: await productService.findById(id) }
})
