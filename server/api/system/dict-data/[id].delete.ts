import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  const dictData = await prisma.sysDictData.findUnique({ where: { id } })
  if (!dictData) {
    throw createError({ statusCode: 404, message: '字典数据不存在' })
  }

  await prisma.sysDictData.delete({ where: { id } })

  return { code: 200, msg: '删除成功' }
})
