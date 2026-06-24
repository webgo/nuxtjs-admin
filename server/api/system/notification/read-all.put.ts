import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) throw createError({ statusCode: 401, message: '未认证' })

  await prisma.sysNotification.updateMany({
    where: { userId: { in: [auth.userId, 0] }, isRead: 0 },
    data: { isRead: 1 },
  })

  return { code: 200, msg: '已全部标记已读' }
})
