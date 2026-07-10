import prisma from '../../../../utils/prisma'

const validTransitions: Record<string, string[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['preparing', 'cancelled'],
  preparing: ['delivering', 'cancelled'],
  delivering: ['delivered'],
  delivered: ['completed'],
  completed: [],
  cancelled: [],
}

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const { status: newStatus } = body

  if (!newStatus) {
    throw createError({ statusCode: 400, message: '目标状态不能为空' })
  }

  const order = await prisma.sysOrder.findUnique({ where: { id } })
  if (!order) {
    throw createError({ statusCode: 404, message: '订单不存在' })
  }

  const allowed = validTransitions[order.status]
  if (!allowed || !allowed.includes(newStatus)) {
    throw createError({
      statusCode: 400,
      message: `不允许从 ${order.status} 变更为 ${newStatus}`,
    })
  }

  const data: any = { status: newStatus }
  if (newStatus === 'paid') {
    data.paymentTime = new Date()
  }

  await prisma.sysOrder.update({ where: { id }, data })

  return { code: 200, msg: '状态更新成功' }
})
