import { authService } from '../../../services/auth.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body
  if (!username || !password) throw createError({ statusCode: 400, message: '用户名和密码不能为空' })

  const ip = getRequestIP(event, { xForwardedFor: true }) || ''
  const result = await authService.login({ username, password, userType: 1, ip })
  return { code: 200, msg: '登录成功', data: result }
})
