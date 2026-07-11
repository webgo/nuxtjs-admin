import { productService } from '../../../services/product.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return { code: 200, msg: '创建成功', data: await productService.create(body) }
})
