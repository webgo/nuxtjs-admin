import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  const unit = await prisma.sysPriceUnit.findUnique({ where: { id } })
  if (!unit) {
    throw createError({ statusCode: 404, message: '价格单位不存在' })
  }

  await prisma.sysPriceUnit.delete({ where: { id } })

  return { code: 200, msg: '删除成功' }
})
