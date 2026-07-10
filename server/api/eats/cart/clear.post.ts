import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) {
    throw createError({ statusCode: 401, message: '未登录' })
  }

  await prisma.sysCart.deleteMany({ where: { userId: auth.userId } })

  return { code: 200, msg: '已清空' }
})
