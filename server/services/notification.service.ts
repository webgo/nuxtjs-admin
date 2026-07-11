import prisma from '../utils/prisma'

export const notificationService = {
  async list(params: { userId: number; page: number; pageSize: number; type?: string; isRead?: number }) {
    const { userId, page, pageSize, type, isRead } = params
    const where: Record<string, unknown> = {
      userId: { in: [userId, 0] },
    }
    if (type) where.type = type
    if (isRead !== undefined) where.isRead = isRead

    const [rows, total] = await Promise.all([
      prisma.sysNotification.findMany({
        where, orderBy: [{ createTime: 'desc' }],
        skip: (page - 1) * pageSize, take: pageSize,
      }),
      prisma.sysNotification.count({ where }),
    ])
    return { list: rows, total, page, pageSize }
  },

  async unreadCount(userId: number) {
    return prisma.sysNotification.count({
      where: { userId: { in: [userId, 0] }, isRead: 0 },
    })
  },

  async markAsRead(id: number, userId: number) {
    const notification = await prisma.sysNotification.findUnique({ where: { id } })
    if (!notification) throw createError({ statusCode: 404, message: '通知不存在' })
    if (notification.userId !== userId && notification.userId !== 0) throw createError({ statusCode: 403, message: '无权操作' })
    await prisma.sysNotification.update({ where: { id }, data: { isRead: 1 } })
    return true
  },

  async markAllAsRead(userId: number) {
    await prisma.sysNotification.updateMany({
      where: { userId: { in: [userId, 0] }, isRead: 0 },
      data: { isRead: 1 },
    })
    return true
  },

  async create(data: { userId: number; title: string; content?: string; type: string }) {
    return prisma.sysNotification.create({ data })
  },
}
