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
