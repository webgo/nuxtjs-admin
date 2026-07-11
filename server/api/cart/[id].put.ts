import { cartService } from '../../services/cart.service'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) throw createError({ statusCode: 401, message: '未登录' })
  const id = Number(getRouterParam(event, 'id'))
  const { quantity } = await readBody(event)
  await cartService.update(id, auth.userId, quantity)
  return { code: 200, msg: '更新成功' }
})
