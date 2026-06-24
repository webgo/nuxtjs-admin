import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  const category = await prisma.sysCategory.findUnique({ where: { id } })
  if (!category) {
    throw createError({ statusCode: 404, message: '分类不存在' })
  }

  await prisma.sysCategory.delete({ where: { id } })

  return { code: 200, msg: '删除成功' }
})
