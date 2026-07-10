import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  const order = await prisma.sysOrder.findUnique({
    where: { id },
    include: {
      merchant: { select: { name: true } },
      items: {
        include: {
          product: { select: { name: true, image: true } },
        },
      },
    },
  })

  if (!order) {
    throw createError({ statusCode: 404, message: '订单不存在' })
  }

  return {
    code: 200,
    data: {
      id: order.id,
      orderNo: order.orderNo,
      merchantId: order.merchantId,
      merchantName: order.merchant.name,
      userId: order.userId,
      totalAmount: Number(order.totalAmount),
      deliveryFee: order.deliveryFee ? Number(order.deliveryFee) : undefined,
      serviceFee: order.serviceFee ? Number(order.serviceFee) : undefined,
      deliveryType: order.deliveryType,
      status: order.status,
      deliveryAddress: order.deliveryAddress,
      contactName: order.contactName,
      contactPhone: order.contactPhone,
      remark: order.remark,
      paymentMethod: order.paymentMethod,
      paymentTime: order.paymentTime?.toISOString(),
      items: order.items.map(i => ({
        id: i.id,
        productId: i.productId,
        productName: i.productName,
        productImage: i.productImage,
        specName: i.specName,
        price: Number(i.price),
        quantity: i.quantity,
        subtotal: Number(i.subtotal),
      })),
      createTime: order.createTime,
    },
  }
})
