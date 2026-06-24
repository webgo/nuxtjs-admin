import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) throw createError({ statusCode: 401, message: '未认证' })

  const count = await prisma.sysNotification.count({
    where: {
      userId: { in: [auth.userId, 0] },
      isRead: 0,
    },
  })

  return { code: 200, data: count }
})
