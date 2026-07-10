import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) {
    throw createError({ statusCode: 401, message: '未登录' })
  }

  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const { quantity } = body

  const cartItem = await prisma.sysCart.findUnique({ where: { id } })
  if (!cartItem) {
    throw createError({ statusCode: 404, message: '购物车项不存在' })
  }
  if (cartItem.userId !== auth.userId) {
    throw createError({ statusCode: 403, message: '无权操作' })
  }

  if (quantity <= 0) {
    await prisma.sysCart.delete({ where: { id } })
    return { code: 200, msg: '已删除' }
  }

  await prisma.sysCart.update({ where: { id }, data: { quantity } })

  return { code: 200, msg: '更新成功' }
})
