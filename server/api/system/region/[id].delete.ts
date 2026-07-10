import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  const record = await prisma.sysRegion.findUnique({ where: { id } })
  if (!record) {
    throw createError({ statusCode: 404, message: '地区不存在' })
  }

  const childCount = await prisma.sysRegion.count({ where: { parentId: id } })
  if (childCount > 0) {
    throw createError({ statusCode: 400, message: '该地区下存在子地区，无法删除' })
  }

  await prisma.sysRegion.delete({ where: { id } })

  return { code: 200, msg: '删除成功' }
})
