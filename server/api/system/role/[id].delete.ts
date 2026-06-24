import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  const role = await prisma.sysRole.findUnique({ where: { id } })
  if (!role) {
    throw createError({ statusCode: 404, message: '角色不存在' })
  }

  if (role.code === 'admin') {
    throw createError({ statusCode: 400, message: '不能删除超级管理员角色' })
  }

  await prisma.sysRole.delete({ where: { id } })

  return { code: 200, msg: '删除成功' }
})
