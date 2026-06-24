import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 20
  const action = query.action as string | undefined
  const target = query.target as string | undefined
  const username = query.username as string | undefined

  const where: Record<string, unknown> = {}
  if (action) where.action = action
  if (target) where.target = target
  if (username) where.username = { contains: username }

  const [rows, total] = await Promise.all([
    prisma.sysAuditLog.findMany({
      where,
      orderBy: { createTime: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.sysAuditLog.count({ where }),
  ])

  return { code: 200, data: { list: rows, total, page, pageSize } }
})
