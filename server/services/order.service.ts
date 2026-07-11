import prisma from '../utils/prisma'

function generateOrderNo(): string {
  const now = new Date()
  const ts = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0')
  const random = Math.floor(1000 + Math.random() * 9000)
  return `DD${ts}${random}`
}

export const orderService = {
  async create(params: { userId: number; merchantId: number; deliveryType?: string; deliveryAddress?: string; contactName?: string; contactPhone?: string; remark?: string; items: Array<{ productId: number; specName?: string; quantity?: number }> }) {
    const { userId, merchantId, deliveryType, deliveryAddress, contactName, contactPhone, remark, items } = params

    if (!items || items.length === 0) throw createError({ statusCode: 400, message: '商品不能为空' })

    const merchant = await prisma.sysMerchant.findUnique({ where: { id: merchantId } })
    if (!merchant) throw createError({ statusCode: 404, message: '商家不存在' })

    const orderNo = generateOrderNo()
    const result = await prisma.$transaction(async (tx) => {
      let totalAmount = 0
      const orderItems: Array<{ productId: number; productName: string; productImage: string | null; specName: string | null; price: number; quantity: number; subtotal: number }> = []

      for (const item of items) {
        const product = await tx.sysProduct.findUnique({
          where: { id: item.productId },
          select: { id: true, name: true, image: true },
        })
        if (!product) throw createError({ statusCode: 404, message: `商品 ${item.productId} 不存在` })

        let price = 0
        if (item.specName) {
          const spec = await tx.sysProductSpec.findFirst({
            where: { productId: item.productId, name: item.specName, status: 1 },
          })
          if (!spec) throw createError({ statusCode: 400, message: `规格 ${item.specName} 不存在` })
          price = Number(spec.price)
        } else {
          const defaultSpec = await tx.sysProductSpec.findFirst({
            where: { productId: item.productId, isDefault: 1, status: 1 },
          })
          if (defaultSpec) price = Number(defaultSpec.price)
        }

        const quantity = item.quantity || 1
        const subtotal = price * quantity
        totalAmount += subtotal

        orderItems.push({ productId: product.id, productName: product.name, productImage: product.image, specName: item.specName || null, price, quantity, subtotal })
      }

      return tx.sysOrder.create({
        data: {
          orderNo, merchantId, userId, totalAmount,
          deliveryFee: merchant.deliveryFee ? Number(merchant.deliveryFee) : 0,
          deliveryType: deliveryType || null, status: 'pending',
          deliveryAddress: deliveryAddress || null, contactName: contactName || null,
          contactPhone: contactPhone || null, remark: remark || null,
          items: { create: orderItems },
        },
      })
    })

    return { id: result.id, orderNo: result.orderNo }
  },

  async list(params: { page: number; pageSize: number; userId?: number; merchantId?: number; status?: string; orderNo?: string }) {
    const { page, pageSize, userId, merchantId, status, orderNo } = params
    const where: Record<string, unknown> = {}
    if (userId !== undefined) where.userId = userId
    if (merchantId !== undefined) where.merchantId = merchantId
    if (status) where.status = status
    if (orderNo) where.orderNo = { contains: orderNo }

    const [rows, total] = await Promise.all([
      prisma.sysOrder.findMany({
        where, skip: (page - 1) * pageSize, take: pageSize,
        orderBy: [{ createTime: 'desc' }],
        include: {
          merchant: { select: { id: true, name: true } },
          items: true,
        },
      }),
      prisma.sysOrder.count({ where }),
    ])

    const list = rows.map(o => ({
      id: o.id, orderNo: o.orderNo, merchantId: o.merchantId, merchantName: o.merchant?.name,
      userId: o.userId,
      totalAmount: Number(o.totalAmount), deliveryFee: Number(o.deliveryFee),
      deliveryType: o.deliveryType, status: o.status,
      deliveryAddress: o.deliveryAddress, contactName: o.contactName, contactPhone: o.contactPhone,
      remark: o.remark, createTime: o.createTime, updateTime: o.updateTime,
      items: o.items.map(item => ({
        id: item.id, productId: item.productId, productName: item.productName,
        productImage: item.productImage, specName: item.specName,
        price: Number(item.price), quantity: item.quantity, subtotal: Number(item.subtotal),
      })),
    }))
    return { list, total, page, pageSize }
  },

  async findById(id: number) {
    const order = await prisma.sysOrder.findUnique({
      where: { id },
      include: {
        merchant: { select: { id: true, name: true, contactPhone: true } },
        items: true,
      },
    })
    if (!order) throw createError({ statusCode: 404, message: '订单不存在' })
    return order
  },

  async updateStatus(id: number, status: string) {
    const order = await prisma.sysOrder.findUnique({ where: { id } })
    if (!order) throw createError({ statusCode: 404, message: '订单不存在' })

    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'], confirmed: ['preparing', 'cancelled'],
      preparing: ['delivering', 'cancelled'], delivering: ['delivered'],
      delivered: ['completed'], completed: [], cancelled: [],
    }
    if (!validTransitions[order.status]?.includes(status)) {
      throw createError({ statusCode: 400, message: `不能从 ${order.status} 变更为 ${status}` })
    }
    await prisma.sysOrder.update({ where: { id }, data: { status } })
    return this.findById(id)
  },

  async cancel(id: number, userId: number) {
    const order = await prisma.sysOrder.findUnique({ where: { id } })
    if (!order) throw createError({ statusCode: 404, message: '订单不存在' })
    if (order.userId !== userId) throw createError({ statusCode: 403, message: '无权操作' })
    if (!['pending', 'confirmed'].includes(order.status)) throw createError({ statusCode: 400, message: '当前状态不能取消' })
    await prisma.sysOrder.update({ where: { id }, data: { status: 'cancelled' } })
    return this.findById(id)
  },
}
