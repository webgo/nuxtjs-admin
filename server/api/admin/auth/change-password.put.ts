import { authService } from '../../../services/auth.service'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) throw createError({ statusCode: 401, message: '未认证' })

  const { oldPassword, newPassword } = await readBody(event)
  if (!oldPassword || !newPassword) throw createError({ statusCode: 400, message: '请填写旧密码和新密码' })
  if (newPassword.length < 6) throw createError({ statusCode: 400, message: '新密码至少6位' })

  await authService.changePassword(auth.userId, oldPassword, newPassword)
  return { code: 200, msg: '密码修改成功' }
})
