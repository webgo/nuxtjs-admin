import { authService } from '../../../services/auth.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body

  if (!email || !password) {
    throw createError({ statusCode: 400, message: '邮箱和密码不能为空' })
  }

  const result = await authService.loginByEmail({
    email,
    password,
    ip: getRequestIP(event, { xForwardedFor: true }) || '',
  })

  return {
    code: 200,
    msg: '登录成功',
    data: result,
  }
})
