import db from '../utils/db'
import { sysOrder, sysOrderItem, sysMerchant, sysProduct, sysProductSpec } from '../../db/schema'
import { eq, and, like, desc, count as drizzleCount } from 'drizzle-orm'

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

    const [merchant] = await db.select().from(sysMerchant).where(eq(sysMerchant.id, merchantId))
    if (!merchant) throw createError({ statusCode: 404, message: '商家不存在' })

    const orderNo = generateOrderNo()
    const now = new Date().toISOString().slice(0, 23).replace('T', ' ')

    let totalAmount = 0
    const orderItems: Array<{ productId: number; productName: string; productImage: string | null; specName: string | null; price: number; quantity: number; subtotal: number }> = []

    for (const item of items) {
      const [product] = await db.select({ id: sysProduct.id, name: sysProduct.name, image: sysProduct.image })
        .from(sysProduct).where(eq(sysProduct.id, item.productId))
      if (!product) throw createError({ statusCode: 404, message: `商品 ${item.productId} 不存在` })

      let price = 0
      if (item.specName) {
        const [spec] = await db.select().from(sysProductSpec)
          .where(and(eq(sysProductSpec.productId, item.productId), eq(sysProductSpec.name, item.specName), eq(sysProductSpec.status, 1)))
        if (!spec) throw createError({ statusCode: 400, message: `规格 ${item.specName} 不存在` })
        price = Number(spec.price)
      } else {
        const [defaultSpec] = await db.select().from(sysProductSpec)
          .where(and(eq(sysProductSpec.productId, item.productId), eq(sysProductSpec.isDefault, 1), eq(sysProductSpec.status, 1)))
        if (defaultSpec) price = Number(defaultSpec.price)
      }

      const quantity = item.quantity || 1
      const subtotal = price * quantity
      totalAmount += subtotal
      orderItems.push({ productId: product.id, productName: product.name, productImage: product.image, specName: item.specName || null, price, quantity, subtotal })
    }

    const [result] = await db.insert(sysOrder).values({
      orderNo, merchantId, userId, totalAmount: String(totalAmount),
      deliveryFee: merchant.deliveryFee || '0',
      deliveryType: deliveryType || null, status: 'pending',
      deliveryAddress: deliveryAddress || null, contactName: contactName || null,
      contactPhone: contactPhone || null, remark: remark || null,
      updateTime: now,
    }).execute()

    const orderId = Number((result as any).insertId)

    if (orderItems.length > 0) {
      await db.insert(sysOrderItem).values(
        orderItems.map(item => ({
          orderId, productId: item.productId, productName: item.productName,
          productImage: item.productImage, specName: item.specName,
          price: String(item.price), quantity: item.quantity, subtotal: String(item.subtotal),
        }))
      )
    }

    return { id: orderId, orderNo }
  },

  async list(params: { page: number; pageSize: number; userId?: number; merchantId?: number; status?: string; orderNo?: string }) {
    const { page, pageSize, userId, merchantId, status, orderNo } = params
    const conditions = []
    if (userId !== undefined) conditions.push(eq(sysOrder.userId, userId))
    if (merchantId !== undefined) conditions.push(eq(sysOrder.merchantId, merchantId))
    if (status) conditions.push(eq(sysOrder.status, status))
    if (orderNo) conditions.push(like(sysOrder.orderNo, `%${orderNo}%`))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const baseQuery = db.select({
      id: sysOrder.id, orderNo: sysOrder.orderNo, merchantId: sysOrder.merchantId,
      merchantName: sysMerchant.name, userId: sysOrder.userId,
      totalAmount: sysOrder.totalAmount, deliveryFee: sysOrder.deliveryFee,
      deliveryType: sysOrder.deliveryType, status: sysOrder.status,
      deliveryAddress: sysOrder.deliveryAddress, contactName: sysOrder.contactName,
      contactPhone: sysOrder.contactPhone, remark: sysOrder.remark,
      createTime: sysOrder.createTime, updateTime: sysOrder.updateTime,
    }).from(sysOrder)
      .leftJoin(sysMerchant, eq(sysOrder.merchantId, sysMerchant.id))
      .where(where)
      .orderBy(desc(sysOrder.createTime))

    const [countResult] = await db.select({ count: drizzleCount() }).from(sysOrder).where(where)
    const total = Number(countResult?.count || 0)
    const orders = await baseQuery.limit(pageSize).offset((page - 1) * pageSize)

    const orderIds = orders.map(o => o.id)
    const allItems = orderIds.length > 0
      ? await db.select().from(sysOrderItem).where(inArray(sysOrderItem.orderId, orderIds))
      : []

    const itemsByOrder = new Map<number, typeof allItems>()
    for (const item of allItems) {
      if (!itemsByOrder.has(item.orderId)) itemsByOrder.set(item.orderId, [])
      itemsByOrder.get(item.orderId)!.push(item)
    }

    const list = orders.map(o => ({
      ...o,
      totalAmount: Number(o.totalAmount), deliveryFee: Number(o.deliveryFee),
      items: (itemsByOrder.get(o.id) || []).map(item => ({
        id: item.id, productId: item.productId, productName: item.productName,
        productImage: item.productImage, specName: item.specName,
        price: Number(item.price), quantity: item.quantity, subtotal: Number(item.subtotal),
      })),
    }))
    return { list, total, page, pageSize }
  },

  async findById(id: number) {
    const [order] = await db.select({
      id: sysOrder.id, orderNo: sysOrder.orderNo, merchantId: sysOrder.merchantId,
      merchantName: sysMerchant.name, merchantContactPhone: sysMerchant.contactPhone,
      userId: sysOrder.userId, totalAmount: sysOrder.totalAmount, deliveryFee: sysOrder.deliveryFee,
      serviceFee: sysOrder.serviceFee, deliveryType: sysOrder.deliveryType, status: sysOrder.status,
      deliveryAddress: sysOrder.deliveryAddress, contactName: sysOrder.contactName,
      contactPhone: sysOrder.contactPhone, remark: sysOrder.remark,
      paymentMethod: sysOrder.paymentMethod, paymentTime: sysOrder.paymentTime,
      createTime: sysOrder.createTime, updateTime: sysOrder.updateTime,
    }).from(sysOrder)
      .leftJoin(sysMerchant, eq(sysOrder.merchantId, sysMerchant.id))
      .where(eq(sysOrder.id, id))
    if (!order) throw createError({ statusCode: 404, message: '订单不存在' })

    const items = await db.select().from(sysOrderItem).where(eq(sysOrderItem.orderId, id))

    return {
      ...order,
      totalAmount: Number(order.totalAmount),
      deliveryFee: Number(order.deliveryFee),
      serviceFee: order.serviceFee ? Number(order.serviceFee) : undefined,
      items: items.map(item => ({
        ...item, price: Number(item.price), subtotal: Number(item.subtotal),
      })),
    }
  },

  async updateStatus(id: number, status: string) {
    const [order] = await db.select().from(sysOrder).where(eq(sysOrder.id, id))
    if (!order) throw createError({ statusCode: 404, message: '订单不存在' })

    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'], confirmed: ['preparing', 'cancelled'],
      preparing: ['delivering', 'cancelled'], delivering: ['delivered'],
      delivered: ['completed'], completed: [], cancelled: [],
    }
    if (!validTransitions[order.status]?.includes(status)) {
      throw createError({ statusCode: 400, message: `不能从 ${order.status} 变更为 ${status}` })
    }
    await db.update(sysOrder).set({ status }).where(eq(sysOrder.id, id))
    return this.findById(id)
  },

  async cancel(id: number, userId: number) {
    const [order] = await db.select().from(sysOrder).where(eq(sysOrder.id, id))
    if (!order) throw createError({ statusCode: 404, message: '订单不存在' })
    if (order.userId !== userId) throw createError({ statusCode: 403, message: '无权操作' })
    if (!['pending', 'confirmed'].includes(order.status)) throw createError({ statusCode: 400, message: '当前状态不能取消' })
    await db.update(sysOrder).set({ status: 'cancelled' }).where(eq(sysOrder.id, id))
    return this.findById(id)
  },
}

import { inArray } from 'drizzle-orm'