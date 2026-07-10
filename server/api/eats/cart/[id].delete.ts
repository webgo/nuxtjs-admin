import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) {
    throw createError({ statusCode: 401, message: '未登录' })
  }

  const id = Number(getRouterParam(event, 'id'))

  const cartItem = await prisma.sysCart.findUnique({ where: { id } })
  if (!cartItem) {
    throw createError({ statusCode: 404, message: '购物车项不存在' })
  }
  if (cartItem.userId !== auth.userId) {
    throw createError({ statusCode: 403, message: '无权操作' })
  }

  await prisma.sysCart.delete({ where: { id } })

  return { code: 200, msg: '删除成功' }
})
