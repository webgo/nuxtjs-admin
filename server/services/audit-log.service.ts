import db from '../utils/db'
import { sysAuditLog } from '../../db/schema'
import { eq, like, desc, and, count } from 'drizzle-orm'

export const auditLogService = {
  async list(params: { page: number; pageSize: number; username?: string; action?: string; target?: string }) {
    const { page, pageSize, username, action, target } = params
    const conditions: ReturnType<typeof eq>[] = []
    if (username) conditions.push(like(sysAuditLog.username, `%${username}%`))
    if (action) conditions.push(eq(sysAuditLog.action, action))
    if (target) conditions.push(eq(sysAuditLog.target, target))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [rows, countResult] = await Promise.all([
      db.select().from(sysAuditLog)
        .where(where)
        .orderBy(desc(sysAuditLog.createTime))
        .offset((page - 1) * pageSize)
        .limit(pageSize),
      db.select({ count: count() }).from(sysAuditLog).where(where),
    ])
    return { list: rows, total: countResult[0]?.count ?? 0, page, pageSize }
  },
}
