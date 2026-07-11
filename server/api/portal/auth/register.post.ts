import bcrypt from 'bcryptjs'
import { signToken } from '../../../utils/jwt'
import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, email, password, nickname, phone } = body

  if (!username || !email || !password) {
    throw createError({ statusCode: 400, message: '用户名、邮箱和密码不能为空' })
  }

  if (username.length < 2 || username.length > 20) {
    throw createError({ statusCode: 400, message: '用户名长度需在 2-20 个字符之间' })
  }

  if (password.length < 6) {
    throw createError({ statusCode: 400, message: '密码长度不能少于 6 个字符' })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw createError({ statusCode: 400, message: '邮箱格式不正确' })
  }

  const existingUsername = await prisma.sysUser.findUnique({ where: { username } })
  if (existingUsername) {
    throw createError({ statusCode: 409, message: '用户名已被注册' })
  }

  const existingEmail = await prisma.sysUser.findFirst({ where: { email } })
  if (existingEmail) {
    throw createError({ statusCode: 409, message: '邮箱已被注册' })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.sysUser.create({
    data: {
      username,
      email,
      password: hashedPassword,
      nickname: nickname || username,
      phone: phone || null,
      userType: 0,
      status: 1,
    },
  })

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
    console.warn('[Portal Register] online user record failed:', (err as Error).message)
  }

  return {
    code: 200,
    msg: '注册成功',
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
