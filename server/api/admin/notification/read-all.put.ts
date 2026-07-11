import { notificationService } from '../../../services/notification.service'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) throw createError({ statusCode: 401, message: '未认证' })
  await notificationService.markAllAsRead(auth.userId)
  return { code: 200, msg: '操作成功' }
})
