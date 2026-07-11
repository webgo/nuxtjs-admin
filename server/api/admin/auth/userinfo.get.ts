import { authService } from '../../../services/auth.service'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) throw createError({ statusCode: 401, message: '未认证' })
  const data = await authService.getUserInfo(auth.userId)
  return { code: 200, data }
})
