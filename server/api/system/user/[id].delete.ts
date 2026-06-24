import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  const user = await prisma.sysUser.findUnique({ where: { id } })
  if (!user) {
    throw createError({ statusCode: 404, message: '用户不存在' })
  }

  if (user.username === 'admin') {
    throw createError({ statusCode: 400, message: '不能删除超级管理员' })
  }

  await prisma.sysUser.delete({ where: { id } })

  return { code: 200, msg: '删除成功' }
})
