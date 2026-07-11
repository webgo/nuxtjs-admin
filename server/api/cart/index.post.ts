import { cartService } from '../../services/cart.service'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) throw createError({ statusCode: 401, message: '未登录' })
  const body = await readBody(event)
  await cartService.add({ userId: auth.userId, ...body })
  return { code: 200, msg: '添加成功' }
})
