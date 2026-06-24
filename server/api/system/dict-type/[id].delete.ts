import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  const dictType = await prisma.sysDictType.findUnique({ where: { id } })
  if (!dictType) {
    throw createError({ statusCode: 404, message: '字典类型不存在' })
  }

  await prisma.sysDictType.delete({ where: { id } })

  return { code: 200, msg: '删除成功' }
})
