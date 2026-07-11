import { cartService } from '../../services/cart.service'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) throw createError({ statusCode: 401, message: '未登录' })
  return { code: 200, data: await cartService.list(auth.userId) }
})
