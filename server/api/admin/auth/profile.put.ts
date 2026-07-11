import { authService } from '../../../services/auth.service'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) throw createError({ statusCode: 401, message: '未认证' })

  const body = await readBody(event)
  const { nickname, email, phone, avatar } = body
  const data: Record<string, unknown> = {}
  if (nickname !== undefined) data.nickname = nickname
  if (email !== undefined) data.email = email
  if (phone !== undefined) data.phone = phone
  if (avatar !== undefined) data.avatar = avatar

  const user = await authService.updateProfile(auth.userId, data as any)
  return { code: 200, msg: '更新成功', data: user }
})
