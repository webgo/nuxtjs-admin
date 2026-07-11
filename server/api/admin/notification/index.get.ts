import { notificationService } from '../../../services/notification.service'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) throw createError({ statusCode: 401, message: '未认证' })
  const query = getQuery(event)
  const params: any = { userId: auth.userId, page: Number(query.page) || 1, pageSize: Number(query.pageSize) || 20 }
  if (query.type) params.type = query.type
  if (query.isRead !== undefined) params.isRead = Number(query.isRead)
  return { code: 200, data: await notificationService.list(params) }
})
