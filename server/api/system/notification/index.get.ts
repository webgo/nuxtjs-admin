import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) throw createError({ statusCode: 401, message: '未认证' })

  const query = getQuery(event)
  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 20
  const type = query.type as string | undefined
  const isRead = query.isRead !== undefined ? Number(query.isRead) : undefined

  const where: Record<string, unknown> = {
    userId: { in: [auth.userId, 0] },
  }
  if (type) where.type = type
  if (isRead !== undefined) where.isRead = isRead

  const [rows, total] = await Promise.all([
    prisma.sysNotification.findMany({
      where,
      orderBy: { createTime: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.sysNotification.count({ where }),
  ])

  return { code: 200, data: { list: rows, total, page, pageSize } }
})
