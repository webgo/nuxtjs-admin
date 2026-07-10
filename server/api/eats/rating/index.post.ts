import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) {
    throw createError({ statusCode: 401, message: '未登录' })
  }

  const body = await readBody(event)
  const { orderId, productId, rating, content, images } = body

  if (!orderId || !rating) {
    throw createError({ statusCode: 400, message: '订单和评分不能为空' })
  }

  if (rating < 1 || rating > 5) {
    throw createError({ statusCode: 400, message: '评分必须在 1-5 之间' })
  }

  const order = await prisma.sysOrder.findUnique({ where: { id: orderId } })
  if (!order) {
    throw createError({ statusCode: 404, message: '订单不存在' })
  }
  if (order.userId !== auth.id) {
    throw createError({ statusCode: 403, message: '只能评价自己的订单' })
  }

  const existingRating = await prisma.sysRating.findUnique({ where: { orderId } })
  if (existingRating) {
    throw createError({ statusCode: 409, message: '该订单已评价' })
  }

  const record = await prisma.sysRating.create({
    data: {
      orderId,
      userId: auth.id,
      merchantId: order.merchantId,
      productId: productId || null,
      rating,
      content: content || null,
      images: images || null,
    },
  })

  const stats = await prisma.sysRating.aggregate({
    where: { merchantId: order.merchantId },
    _avg: { rating: true },
    _count: { rating: true },
  })
  await prisma.sysMerchant.update({
    where: { id: order.merchantId },
    data: {
      rating: stats._avg.rating ? Number(stats._avg.rating.toFixed(1)) : 0,
      ratingCount: stats._count.rating,
    },
  })

  return { code: 200, msg: '评价成功', data: { id: record.id } }
})
