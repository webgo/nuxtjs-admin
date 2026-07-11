import { orderService } from '../../services/order.service'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) throw createError({ statusCode: 401, message: '未登录' })
  const body = await readBody(event)
  const result = await orderService.create({ userId: auth.userId, ...body })
  return { code: 200, msg: '下单成功', data: result }
})
