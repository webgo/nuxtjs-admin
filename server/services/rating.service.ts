import db from '../utils/db'
import { sysRating, sysUser, sysProduct, sysOrder, sysMerchant } from '../../db/schema'
import { eq, and, desc, count as drizzleCount, sql } from 'drizzle-orm'

export const ratingService = {
  async list(params: { page: number; pageSize: number; merchantId?: number; rating?: number }) {
    const { page, pageSize, merchantId, rating } = params
    const conditions = []
    if (merchantId) conditions.push(eq(sysRating.merchantId, merchantId))
    if (rating) conditions.push(eq(sysRating.rating, rating))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const baseQuery = db.select({
      id: sysRating.id, orderId: sysRating.orderId, userId: sysRating.userId,
      username: sysUser.username,
      merchantId: sysRating.merchantId, productId: sysRating.productId,
      productName: sysProduct.name,
      rating: sysRating.rating, content: sysRating.content, images: sysRating.images,
      createTime: sysRating.createTime,
    }).from(sysRating)
      .leftJoin(sysUser, eq(sysRating.userId, sysUser.id))
      .leftJoin(sysProduct, eq(sysRating.productId, sysProduct.id))
      .where(where)
      .orderBy(desc(sysRating.createTime))

    const [countResult] = await db.select({ count: drizzleCount() }).from(sysRating).where(where)
    const total = Number(countResult?.count || 0)
    const list = await baseQuery.limit(pageSize).offset((page - 1) * pageSize)

    return { list, total, page, pageSize }
  },

  async create(params: { userId: number; orderId: number; productId?: number; rating: number; content?: string; images?: string }) {
    const { userId, orderId, productId, rating, content, images } = params

    if (rating < 1 || rating > 5) throw createError({ statusCode: 400, message: '评分必须在 1-5 之间' })

    const [order] = await db.select().from(sysOrder).where(eq(sysOrder.id, orderId))
    if (!order) throw createError({ statusCode: 404, message: '订单不存在' })
    if (order.userId !== userId) throw createError({ statusCode: 403, message: '只能评价自己的订单' })

    const [existing] = await db.select().from(sysRating).where(eq(sysRating.orderId, orderId))
    if (existing) throw createError({ statusCode: 409, message: '该订单已评价' })

    const [result] = await db.insert(sysRating).values({
      orderId, userId, merchantId: order.merchantId, productId: productId || null,
      rating, content: content || null, images: images || null,
    }).execute()

    const insertId = Number((result as any).insertId)

    const [stats] = await db.select({
      avgRating: sql<number>`avg(${sysRating.rating})`.mapWith(Number),
      totalRatings: drizzleCount(),
    }).from(sysRating).where(eq(sysRating.merchantId, order.merchantId))

    await db.update(sysMerchant).set({
      rating: stats?.avgRating ? Number(stats.avgRating.toFixed(1)).toString() : '0',
      ratingCount: Number(stats?.totalRatings || 0),
    }).where(eq(sysMerchant.id, order.merchantId))

    return { id: insertId }
  },

  async listByMerchant(merchantId: number, page: number, pageSize: number) {
    const [countResult] = await db.select({ count: drizzleCount() }).from(sysRating).where(eq(sysRating.merchantId, merchantId))
    const total = Number(countResult?.count || 0)
    const rows = await db.select().from(sysRating)
      .where(eq(sysRating.merchantId, merchantId))
      .orderBy(desc(sysRating.createTime))
      .limit(pageSize).offset((page - 1) * pageSize)
    const list = rows.map(r => ({
      id: r.id, orderId: r.orderId, userId: r.userId, merchantId: r.merchantId, productId: r.productId,
      rating: r.rating, content: r.content, images: r.images, createTime: r.createTime,
    }))
    return { list, total, page, pageSize }
  },

  async listByUser(userId: number, page: number, pageSize: number) {
    const baseQuery = db.select({
      id: sysRating.id, orderId: sysRating.orderId, merchantId: sysRating.merchantId,
      merchantName: sysMerchant.name, productId: sysRating.productId,
      rating: sysRating.rating, content: sysRating.content, images: sysRating.images,
      createTime: sysRating.createTime,
    }).from(sysRating)
      .leftJoin(sysMerchant, eq(sysRating.merchantId, sysMerchant.id))
      .where(eq(sysRating.userId, userId))
      .orderBy(desc(sysRating.createTime))

    const [countResult] = await db.select({ count: drizzleCount() }).from(sysRating).where(eq(sysRating.userId, userId))
    const total = Number(countResult?.count || 0)
    const list = await baseQuery.limit(pageSize).offset((page - 1) * pageSize)

    return { list, total, page, pageSize }
  },

  async getMerchantStats(merchantId: number) {
    const [stats] = await db.select({
      avgRating: sql<number>`avg(${sysRating.rating})`.mapWith(Number),
      totalRatings: drizzleCount(),
    }).from(sysRating).where(eq(sysRating.merchantId, merchantId))

    const distribution = await db.select({
      rating: sysRating.rating,
      count: drizzleCount(),
    }).from(sysRating)
      .where(eq(sysRating.merchantId, merchantId))
      .groupBy(sysRating.rating)

    return {
      average: stats?.avgRating ? Number(stats.avgRating.toFixed(1)) : 0,
      total: Number(stats?.totalRatings || 0),
      distribution: distribution.map(d => ({ rating: d.rating, count: Number(d.count) })),
    }
  },
}
