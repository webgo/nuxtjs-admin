import bcrypt from 'bcryptjs'
import { signToken } from '../../utils/jwt'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body

  if (!username || !password) {
    throw createError({ statusCode: 400, message: '用户名和密码不能为空' })
  }

  const user = await prisma.sysUser.findUnique({ where: { username } })
  if (!user) {
    throw createError({ statusCode: 401, message: '用户名或密码错误' })
  }

  if (user.status === 0) {
    throw createError({ statusCode: 403, message: '账号已被禁用，请联系管理员' })
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    throw createError({ statusCode: 401, message: '用户名或密码错误' })
  }

  const token = signToken({ userId: user.id, username: user.username })

  // 写入在线用户记录（经由 Nitro Storage，支持 Redis / fs 自动降级）
  try {
    const { setItem } = await import('../../utils/storage')
    const ip = getRequestIP(event, { xForwardedFor: true }) || ''
    const onlineData = {
      userId: user.id,
      username: user.username,
      nickname: user.nickname,
      ip,
      loginTime: new Date().toISOString(),
      token,
    }
    const ttl = 60 * 60 * 24 // 24h，与 JWT 一致
    await setItem(`online_user:${user.id}`, onlineData, { ttl })
    await setItem(`online_token:${token}`, String(user.id), { ttl })
  } catch (err) {
    // 存储不可用时不影响登录流程
    console.warn('[Login] online user record failed:', (err as Error).message)
  }

  // 创建欢迎登录通知
  try {
    await prisma.sysNotification.create({
      data: {
        userId: user.id,
        title: '欢迎回来！',
        content: `${user.nickname || user.username}，您已于 ${new Date().toLocaleString('zh-CN')} 成功登录系统。`,
        type: 'system',
      },
    })
  } catch {
    // 通知创建失败不影响登录
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
      },
    },
  }
})
