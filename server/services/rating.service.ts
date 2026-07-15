import prisma from '../utils/prisma'

export const ratingService = {
  async list(params: { page: number; pageSize: number; merchantId?: number; rating?: number }) {
    const { page, pageSize, merchantId, rating } = params
    const where: Record<string, unknown> = Object.create(null)
    if (merchantId) where.merchantId = merchantId
    if (rating) where.rating = rating

    const [rows, total] = await Promise.all([
      prisma.sysRating.findMany({
        where, skip: (page - 1) * pageSize, take: pageSize,
        orderBy: [{ createTime: 'desc' }],
        include: {
          user: { select: { username: true } },
          product: { select: { name: true } },
        },
      }),
      prisma.sysRating.count({ where }),
    ])
    const list = rows.map(r => ({
      id: r.id, orderId: r.orderId, userId: r.userId, username: r.user?.username,
      merchantId: r.merchantId, productId: r.productId, productName: r.product?.name,
      rating: r.rating, content: r.content, images: r.images, createTime: r.createTime,
    }))
    return { list, total, page, pageSize }
  },

  async create(params: { userId: number; orderId: number; productId?: number; rating: number; content?: string; images?: string }) {
    const { userId, orderId, productId, rating, content, images } = params

    if (rating < 1 || rating > 5) throw createError({ statusCode: 400, message: '评分必须在 1-5 之间' })

    const order = await prisma.sysOrder.findUnique({ where: { id: orderId } })
    if (!order) throw createError({ statusCode: 404, message: '订单不存在' })
    if (order.userId !== userId) throw createError({ statusCode: 403, message: '只能评价自己的订单' })

    const existing = await prisma.sysRating.findUnique({ where: { orderId } })
    if (existing) throw createError({ statusCode: 409, message: '该订单已评价' })

    const record = await prisma.sysRating.create({
      data: { orderId, userId, merchantId: order.merchantId, productId: productId || null, rating, content: content || null, images: images || null },
    })

    const stats = await prisma.sysRating.aggregate({
      where: { merchantId: order.merchantId },
      _avg: { rating: true }, _count: { rating: true },
    })
    await prisma.sysMerchant.update({
      where: { id: order.merchantId },
      data: { rating: stats._avg.rating ? Number(stats._avg.rating.toFixed(1)) : 0, ratingCount: stats._count.rating },
    })

    return { id: record.id }
  },

  async listByMerchant(merchantId: number, page: number, pageSize: number) {
    const [rows, total] = await Promise.all([
      prisma.sysRating.findMany({
        where: { merchantId }, skip: (page - 1) * pageSize, take: pageSize,
        orderBy: [{ createTime: 'desc' }],
      }),
      prisma.sysRating.count({ where: { merchantId } }),
    ])
    const list = rows.map(r => ({
      id: r.id, orderId: r.orderId, userId: r.userId, merchantId: r.merchantId, productId: r.productId,
      rating: r.rating, content: r.content, images: r.images, createTime: r.createTime,
    }))
    return { list, total, page, pageSize }
  },

  async listByUser(userId: number, page: number, pageSize: number) {
    const [rows, total] = await Promise.all([
      prisma.sysRating.findMany({
        where: { userId }, skip: (page - 1) * pageSize, take: pageSize,
        orderBy: [{ createTime: 'desc' }],
        include: { merchant: { select: { id: true, name: true } } },
      }),
      prisma.sysRating.count({ where: { userId } }),
    ])
    const list = rows.map(r => ({
      id: r.id, orderId: r.orderId, merchantId: r.merchantId, merchantName: r.merchant?.name,
      productId: r.productId, rating: r.rating, content: r.content, images: r.images, createTime: r.createTime,
    }))
    return { list, total, page, pageSize }
  },

  async getMerchantStats(merchantId: number) {
    const stats = await prisma.sysRating.aggregate({
      where: { merchantId }, _avg: { rating: true }, _count: { rating: true },
    })
    const distribution = await prisma.sysRating.groupBy({
      by: ['rating'], where: { merchantId }, _count: { rating: true },
    })
    return {
      average: stats._avg.rating ? Number(stats._avg.rating.toFixed(1)) : 0,
      total: stats._count.rating,
      distribution: distribution.map(d => ({ rating: d.rating, count: d._count.rating })),
    }
  },
}
