import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const { name, symbol, sort, status, remark } = body

  const unit = await prisma.sysPriceUnit.findUnique({ where: { id } })
  if (!unit) {
    throw createError({ statusCode: 404, message: '价格单位不存在' })
  }

  await prisma.sysPriceUnit.update({
    where: { id },
    data: { name, symbol, sort, status, remark },
  })

  return { code: 200, msg: '更新成功' }
})
