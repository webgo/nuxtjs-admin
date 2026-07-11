import { cartService } from '../../services/cart.service'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) throw createError({ statusCode: 401, message: '未登录' })
  const id = Number(getRouterParam(event, 'id'))
  await cartService.remove(id, auth.userId)
  return { code: 200, msg: '删除成功' }
})
