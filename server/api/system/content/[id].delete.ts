import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  const article = await prisma.sysContent.findUnique({ where: { id } })
  if (!article) {
    throw createError({ statusCode: 404, message: '内容不存在' })
  }

  await prisma.sysContent.delete({ where: { id } })

  return { code: 200, msg: '删除成功' }
})
