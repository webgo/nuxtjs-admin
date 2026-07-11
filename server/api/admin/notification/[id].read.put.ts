import { notificationService } from '../../../services/notification.service'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) throw createError({ statusCode: 401, message: '未认证' })
  const id = Number(getRouterParam(event, 'id'))
  await notificationService.markAsRead(id, auth.userId)
  return { code: 200, msg: '操作成功' }
})
