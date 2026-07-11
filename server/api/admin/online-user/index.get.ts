import { monitorService } from '../../../services/monitor.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const params: any = { page: Number(query.page) || 1, pageSize: Number(query.pageSize) || 10 }
  if (query.username) params.username = query.username
  return { code: 200, data: await monitorService.onlineUsers(params) }
})
