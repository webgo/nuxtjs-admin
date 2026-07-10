import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const { remark, contactName, contactPhone, deliveryAddress } = body

  const order = await prisma.sysOrder.findUnique({ where: { id } })
  if (!order) {
    throw createError({ statusCode: 404, message: '订单不存在' })
  }

  const data: any = {}
  if (remark !== undefined) data.remark = remark
  if (contactName !== undefined) data.contactName = contactName
  if (contactPhone !== undefined) data.contactPhone = contactPhone
  if (deliveryAddress !== undefined) data.deliveryAddress = deliveryAddress

  await prisma.sysOrder.update({ where: { id }, data })

  return { code: 200, msg: '更新成功' }
})
