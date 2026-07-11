import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) {
    throw createError({ statusCode: 401, message: '未登录' })
  }

  const user = await prisma.sysUser.findUnique({
    where: { id: auth.userId },
    select: {
      id: true,
      username: true,
      nickname: true,
      email: true,
      phone: true,
      avatar: true,
      status: true,
      userType: true,
    },
  })

  if (!user) {
    throw createError({ statusCode: 404, message: '用户不存在' })
  }

  return {
    code: 200,
    data: { user },
  }
})
