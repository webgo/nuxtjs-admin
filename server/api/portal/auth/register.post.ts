import { authService } from '../../../services/auth.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, email, password, nickname, phone } = body

  if (!username || !email || !password) {
    throw createError({ statusCode: 400, message: '用户名、邮箱和密码不能为空' })
  }

  const result = await authService.register({
    username,
    email,
    password,
    nickname,
    phone,
    ip: getRequestIP(event, { xForwardedFor: true }) || '',
  })

  return {
    code: 200,
    msg: '注册成功',
    data: result,
  }
})
