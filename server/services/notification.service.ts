import db from '../utils/db'
import { sysNotification } from '../../db/schema'
import { eq, desc, and, inArray, count } from 'drizzle-orm'

export const notificationService = {
  async list(params: { userId: number; page: number; pageSize: number; type?: string; isRead?: number }) {
    const { userId, page, pageSize, type, isRead } = params
    const conditions = [inArray(sysNotification.userId, [userId, 0])]
    if (type) conditions.push(eq(sysNotification.type, type))
    if (isRead !== undefined) conditions.push(eq(sysNotification.isRead, isRead))
    const where = and(...conditions)

    const [rows, countResult] = await Promise.all([
      db.select().from(sysNotification)
        .where(where)
        .orderBy(desc(sysNotification.createTime))
        .offset((page - 1) * pageSize)
        .limit(pageSize),
      db.select({ count: count() }).from(sysNotification).where(where),
    ])
    return { list: rows, total: countResult[0]?.count ?? 0, page, pageSize }
  },

  async unreadCount(userId: number) {
    const [result] = await db.select({ count: count() }).from(sysNotification)
      .where(and(inArray(sysNotification.userId, [userId, 0]), eq(sysNotification.isRead, 0)))
    return result?.count ?? 0
  },

  async markAsRead(id: number, userId: number) {
    const [notification] = await db.select().from(sysNotification).where(eq(sysNotification.id, id))
    if (!notification) throw createError({ statusCode: 404, message: '通知不存在' })
    if (notification.userId !== userId && notification.userId !== 0) throw createError({ statusCode: 403, message: '无权操作' })
    await db.update(sysNotification).set({ isRead: 1 }).where(eq(sysNotification.id, id))
    return true
  },

  async markAllAsRead(userId: number) {
    await db.update(sysNotification)
      .set({ isRead: 1 })
      .where(and(inArray(sysNotification.userId, [userId, 0]), eq(sysNotification.isRead, 0)))
    return true
  },

  async create(data: { userId: number; title: string; content?: string; type: string }) {
    const [result] = await db.insert(sysNotification).values(data)
    return { id: Number(result.insertId), ...data }
  },
}
