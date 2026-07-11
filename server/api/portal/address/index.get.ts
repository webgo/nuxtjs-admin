import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) throw createError({ statusCode: 401, message: '未认证' })

  const list = await prisma.sysUserAddress.findMany({
    where: { userId: auth.userId },
    orderBy: [{ isDefault: 'desc' }, { createTime: 'desc' }],
  })

  return { code: 200, msg: 'success', data: list }
})
