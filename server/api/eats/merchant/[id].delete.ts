import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  const record = await prisma.sysMerchant.findUnique({ where: { id } })
  if (!record) {
    throw createError({ statusCode: 404, message: '商家不存在' })
  }

  const activeOrderCount = await prisma.sysOrder.count({
    where: { merchantId: id, status: { notIn: ['completed', 'cancelled'] } },
  })
  if (activeOrderCount > 0) {
    throw createError({ statusCode: 400, message: '该商家有待处理订单，无法删除' })
  }

  await prisma.sysMerchant.delete({ where: { id } })

  return { code: 200, msg: '删除成功' }
})
