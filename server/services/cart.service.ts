import prisma from '../utils/prisma'

export const cartService = {
  async list(userId: number) {
    const items = await prisma.sysCart.findMany({
      where: { userId },
      include: {
        product: { select: { id: true, name: true, image: true, specs: { where: { status: 1 } } } },
        merchant: { select: { id: true, name: true, deliveryFee: true } },
      },
      orderBy: [{ createTime: 'desc' }],
    })

    const grouped = new Map<number, { merchantId: number; merchantName: string; deliveryFee: number | undefined; items: typeof items }>()
    for (const item of items) {
      const mid = item.merchantId
      if (!grouped.has(mid)) {
        grouped.set(mid, { merchantId: mid, merchantName: item.merchant?.name || '', deliveryFee: item.merchant?.deliveryFee ? Number(item.merchant.deliveryFee) : undefined, items: [] })
      }
      grouped.get(mid)!.items.push(item)
    }
    return Array.from(grouped.values())
  },

  async add(params: { userId: number; merchantId: number; productId: number; specName?: string; quantity?: number }) {
    const { userId, merchantId, productId, specName, quantity } = params

    const product = await prisma.sysProduct.findUnique({ where: { id: productId } })
    if (!product) throw createError({ statusCode: 404, message: '商品不存在' })

    const existing = await prisma.sysCart.findFirst({
      where: { userId, merchantId, productId, specName: specName || null },
    })

    if (existing) {
      await prisma.sysCart.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + (quantity || 1) },
      })
    } else {
      await prisma.sysCart.create({
        data: { userId, merchantId, productId, specName: specName || null, quantity: quantity || 1 },
      })
    }
    return true
  },

  async update(id: number, userId: number, quantity: number) {
    const item = await prisma.sysCart.findUnique({ where: { id } })
    if (!item) throw createError({ statusCode: 404, message: '购物车项不存在' })
    if (item.userId !== userId) throw createError({ statusCode: 403, message: '无权操作' })

    if (quantity <= 0) {
      await prisma.sysCart.delete({ where: { id } })
    } else {
      await prisma.sysCart.update({ where: { id }, data: { quantity } })
    }
    return true
  },

  async remove(id: number, userId: number) {
    const item = await prisma.sysCart.findUnique({ where: { id } })
    if (!item) throw createError({ statusCode: 404, message: '购物车项不存在' })
    if (item.userId !== userId) throw createError({ statusCode: 403, message: '无权操作' })
    await prisma.sysCart.delete({ where: { id } })
    return true
  },

  async clear(userId: number) {
    await prisma.sysCart.deleteMany({ where: { userId } })
    return true
  },

  async count(userId: number) {
    const result = await prisma.sysCart.aggregate({
      where: { userId },
      _sum: { quantity: true },
    })
    return result._sum.quantity || 0
  },
}
