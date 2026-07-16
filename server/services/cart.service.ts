import db from '../utils/db'
import { sysCart, sysProduct, sysProductSpec, sysPriceUnit, sysMerchant } from '../../db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'

export const cartService = {
  async list(userId: number) {
    const items = await db.select({
      id: sysCart.id, userId: sysCart.userId, merchantId: sysCart.merchantId,
      productId: sysCart.productId, specName: sysCart.specName,
      quantity: sysCart.quantity, createTime: sysCart.createTime,
      productName: sysProduct.name, productImage: sysProduct.image,
      merchantName: sysMerchant.name, merchantDeliveryFee: sysMerchant.deliveryFee,
    }).from(sysCart)
      .innerJoin(sysProduct, eq(sysCart.productId, sysProduct.id))
      .leftJoin(sysMerchant, eq(sysCart.merchantId, sysMerchant.id))
      .where(eq(sysCart.userId, userId))
      .orderBy(desc(sysCart.createTime))

    const cartProductIds = [...new Set(items.map(i => i.productId))]
    const specs = cartProductIds.length > 0
      ? await db.select({
          productId: sysProductSpec.productId, name: sysProductSpec.name,
          price: sysProductSpec.price, unitSymbol: sysPriceUnit.symbol,
        }).from(sysProductSpec)
          .leftJoin(sysPriceUnit, eq(sysProductSpec.unitId, sysPriceUnit.id))
          .where(and(
            inArray(sysProductSpec.productId, cartProductIds),
            eq(sysProductSpec.status, 1),
          ))
      : []

    const specsByProduct = new Map<number, typeof specs>()
    for (const s of specs) {
      if (!specsByProduct.has(s.productId)) specsByProduct.set(s.productId, [])
      specsByProduct.get(s.productId)!.push(s)
    }

    const itemsWithPrice = items.map((item) => {
      const productSpecs = specsByProduct.get(item.productId) || []
      const matchedSpec = productSpecs.find((s) => s.name === item.specName)
      return {
        id: item.id,
        userId: item.userId,
        merchantId: item.merchantId,
        merchantName: item.merchantName || '',
        productId: item.productId,
        productName: item.productName || '',
        productImage: item.productImage || null,
        specName: item.specName,
        price: matchedSpec?.price ?? 0,
        unitSymbol: matchedSpec?.unitSymbol || '',
        quantity: item.quantity,
        createTime: item.createTime,
      }
    })

    const grouped = new Map<number, { merchantId: number; merchantName: string; deliveryFee: number | undefined; items: typeof itemsWithPrice }>()
    for (const item of itemsWithPrice) {
      const mid = item.merchantId
      if (!grouped.has(mid)) {
        grouped.set(mid, { merchantId: mid, merchantName: item.merchantName, deliveryFee: undefined, items: [] })
      }
      grouped.get(mid)!.items.push(item)
    }
    return Array.from(grouped.values())
  },

  async add(params: { userId: number; merchantId: number; productId: number; specName?: string; quantity?: number }) {
    const { userId, merchantId, productId, specName, quantity } = params

    const [product] = await db.select().from(sysProduct).where(eq(sysProduct.id, productId))
    if (!product) throw createError({ statusCode: 404, message: '商品不存在' })

    const [existing] = await db.select().from(sysCart).where(and(
      eq(sysCart.userId, userId),
      eq(sysCart.merchantId, merchantId),
      eq(sysCart.productId, productId),
      eq(sysCart.specName, specName || ''),
    ))

    if (existing) {
      await db.update(sysCart)
        .set({ quantity: existing.quantity + (quantity || 1) })
        .where(eq(sysCart.id, existing.id))
    } else {
      await db.insert(sysCart).values({
        userId, merchantId, productId, specName: specName || null, quantity: quantity || 1,
        updateTime: new Date().toISOString().slice(0, 23).replace('T', ' '),
      })
    }
    return true
  },

  async update(id: number, userId: number, quantity: number) {
    const [item] = await db.select().from(sysCart).where(eq(sysCart.id, id))
    if (!item) throw createError({ statusCode: 404, message: '购物车项不存在' })
    if (item.userId !== userId) throw createError({ statusCode: 403, message: '无权操作' })

    if (quantity <= 0) {
      await db.delete(sysCart).where(eq(sysCart.id, id))
    } else {
      await db.update(sysCart).set({ quantity }).where(eq(sysCart.id, id))
    }
    return true
  },

  async remove(id: number, userId: number) {
    const [item] = await db.select().from(sysCart).where(eq(sysCart.id, id))
    if (!item) throw createError({ statusCode: 404, message: '购物车项不存在' })
    if (item.userId !== userId) throw createError({ statusCode: 403, message: '无权操作' })
    await db.delete(sysCart).where(eq(sysCart.id, id))
    return true
  },

  async clear(userId: number) {
    await db.delete(sysCart).where(eq(sysCart.userId, userId))
    return true
  },

  async count(userId: number) {
    const [result] = await db.select({
      total: sql<number>`coalesce(sum(${sysCart.quantity}), 0)`.mapWith(Number),
    }).from(sysCart).where(eq(sysCart.userId, userId))
    return result?.total ?? 0
  },
}

import { inArray } from 'drizzle-orm'
