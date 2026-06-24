import prisma from '../../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) throw createError({ statusCode: 401, message: '未认证' })

  const id = Number(getRouterParam(event, 'id'))
  await prisma.sysNotification.updateMany({
    where: { id, userId: { in: [auth.userId, 0] } },
    data: { isRead: 1 },
  })

  return { code: 200, msg: '已标记已读' }
})
