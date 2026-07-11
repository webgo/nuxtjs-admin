import prisma from '../utils/prisma'

export const auditLogService = {
  async list(params: { page: number; pageSize: number; username?: string; action?: string; target?: string }) {
    const { page, pageSize, username, action, target } = params
    const where: Record<string, unknown> = {}
    if (username) where.username = { contains: username }
    if (action) where.action = action
    if (target) where.target = target

    const [rows, total] = await Promise.all([
      prisma.sysAuditLog.findMany({
        where, skip: (page - 1) * pageSize, take: pageSize,
        orderBy: [{ createTime: 'desc' }],
      }),
      prisma.sysAuditLog.count({ where }),
    ])
    return { list: rows, total, page, pageSize }
  },
}
