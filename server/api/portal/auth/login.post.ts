import bcrypt from 'bcryptjs'
import { signToken } from '../../../utils/jwt'
import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body

  if (!email || !password) {
    throw createError({ statusCode: 400, message: '邮箱和密码不能为空' })
  }

  const user = await prisma.sysUser.findFirst({
    where: { email, userType: 0 },
  })
  if (!user) {
    throw createError({ statusCode: 401, message: '邮箱或密码错误' })
  }

  if (user.status === 0) {
    throw createError({ statusCode: 403, message: '账号已被禁用' })
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    throw createError({ statusCode: 401, message: '邮箱或密码错误' })
  }

  const token = signToken({ userId: user.id, username: user.username, userType: 0 })

  try {
    const { setItem } = await import('../../../utils/storage')
    const ip = getRequestIP(event, { xForwardedFor: true }) || ''
    const onlineData = {
      userId: user.id,
      username: user.username,
      nickname: user.nickname,
      ip,
      loginTime: new Date().toISOString(),
      token,
    }
    const ttl = 60 * 60 * 24
    await setItem(`portal_online_user:${user.id}`, onlineData, { ttl })
    await setItem(`portal_online_token:${token}`, String(user.id), { ttl })
  } catch (err) {
    console.warn('[Portal Login] online user record failed:', (err as Error).message)
  }

  return {
    code: 200,
    msg: '登录成功',
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        status: user.status,
        userType: user.userType,
      },
    },
  }
})
