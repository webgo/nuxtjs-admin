import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 10
  const merchantId = query.merchantId !== undefined ? Number(query.merchantId) : undefined
  const userId = query.userId !== undefined ? Number(query.userId) : undefined
  const status = query.status as string | undefined
  const orderNo = query.orderNo as string | undefined
  const deliveryType = query.deliveryType as string | undefined

  const where: any = {}
  if (merchantId !== undefined) where.merchantId = merchantId
  if (userId !== undefined) where.userId = userId
  if (status) where.status = status
  if (orderNo) where.orderNo = { contains: orderNo }
  if (deliveryType) where.deliveryType = deliveryType

  const [rows, total] = await Promise.all([
    prisma.sysOrder.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createTime: 'desc' },
      include: {
        merchant: { select: { name: true } },
        items: true,
      },
    }),
    prisma.sysOrder.count({ where }),
  ])

  const list = rows.map(o => ({
    id: o.id,
    orderNo: o.orderNo,
    merchantId: o.merchantId,
    merchantName: o.merchant.name,
    userId: o.userId,
    totalAmount: Number(o.totalAmount),
    deliveryFee: o.deliveryFee ? Number(o.deliveryFee) : undefined,
    serviceFee: o.serviceFee ? Number(o.serviceFee) : undefined,
    deliveryType: o.deliveryType,
    status: o.status,
    deliveryAddress: o.deliveryAddress,
    contactName: o.contactName,
    contactPhone: o.contactPhone,
    remark: o.remark,
    paymentMethod: o.paymentMethod,
    paymentTime: o.paymentTime?.toISOString(),
    items: o.items.map(i => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      productImage: i.productImage,
      specName: i.specName,
      price: Number(i.price),
      quantity: i.quantity,
      subtotal: Number(i.subtotal),
    })),
    createTime: o.createTime,
  }))

  return { code: 200, data: { list, total, page, pageSize } }
})
