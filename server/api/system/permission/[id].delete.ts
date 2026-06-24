import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  const perm = await prisma.sysPermission.findUnique({ where: { id } })
  if (!perm) {
    throw createError({ statusCode: 404, message: '菜单不存在' })
  }

  // 检查是否有子菜单
  const children = await prisma.sysPermission.findMany({ where: { parentId: id } })
  if (children.length > 0) {
    throw createError({ statusCode: 400, message: '存在子菜单，不能删除' })
  }

  await prisma.sysPermission.delete({ where: { id } })

  return { code: 200, msg: '删除成功' }
})
