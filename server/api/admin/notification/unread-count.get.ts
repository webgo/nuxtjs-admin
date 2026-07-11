import { notificationService } from '../../../services/notification.service'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) throw createError({ statusCode: 401, message: '未认证' })
  return { code: 200, data: await notificationService.unreadCount(auth.userId) }
})
