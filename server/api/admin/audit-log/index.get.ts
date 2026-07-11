import { auditLogService } from '../../../services/audit-log.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const params: any = { page: Number(query.page) || 1, pageSize: Number(query.pageSize) || 10 }
  if (query.username) params.username = query.username
  if (query.action) params.action = query.action
  if (query.target) params.target = query.target
  return { code: 200, data: await auditLogService.list(params) }
})
