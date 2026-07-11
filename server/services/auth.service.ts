import bcrypt from 'bcryptjs'
import prisma from '../utils/prisma'
import { signToken } from '../utils/jwt'
import { setItem } from '../utils/storage'

interface LoginParams {
  username: string
  password: string
  userType: 1 | 0
  ip?: string
}

interface RegisterParams {
  username: string
  email: string
  password: string
  nickname?: string
  phone?: string
  ip?: string
}

export const authService = {
  async login(params: LoginParams) {
    const { username, password, userType, ip } = params

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

    const token = signToken({ userId: user.id, username: user.username, userType })

    const prefix = userType === 1 ? 'admin' : 'portal'
    try {
      const onlineData = {
        userId: user.id,
        username: user.username,
        nickname: user.nickname,
        ip: ip || '',
        loginTime: new Date().toISOString(),
        token,
      }
      const ttl = 60 * 60 * 24
      await setItem(`${prefix}_online_user:${user.id}`, onlineData, { ttl })
      await setItem(`${prefix}_online_token:${token}`, String(user.id), { ttl })
    } catch (err) {
      console.warn('[Auth] online user record failed:', (err as Error).message)
    }

    if (userType === 1) {
      try {
        await prisma.sysNotification.create({
          data: {
            userId: user.id,
            title: '欢迎回来！',
            content: `${user.nickname || user.username}，您已于 ${new Date().toLocaleString('zh-CN')} 成功登录系统。`,
            type: 'system',
          },
        })
      } catch { /* 通知失败不影响登录 */ }
    }

    return {
      token,
      user: {
        id: user.id, username: user.username, nickname: user.nickname,
        email: user.email, phone: user.phone, avatar: user.avatar,
        status: user.status, userType: user.userType,
      },
    }
  },

  async register(params: RegisterParams) {
    const { username, email, password, nickname, phone, ip } = params

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
    if (existingUsername) throw createError({ statusCode: 409, message: '用户名已被注册' })
    const existingEmail = await prisma.sysUser.findFirst({ where: { email } })
    if (existingEmail) throw createError({ statusCode: 409, message: '邮箱已被注册' })

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.sysUser.create({
      data: {
        username, email, password: hashedPassword,
        nickname: nickname || username, phone: phone || null,
        userType: 0, status: 1,
      },
    })

    const token = signToken({ userId: user.id, username: user.username, userType: 0 })
    try {
      const onlineData = {
        userId: user.id, username: user.username, nickname: user.nickname,
        ip: ip || '', loginTime: new Date().toISOString(), token,
      }
      const ttl = 60 * 60 * 24
      await setItem(`portal_online_user:${user.id}`, onlineData, { ttl })
      await setItem(`portal_online_token:${token}`, String(user.id), { ttl })
    } catch (err) {
      console.warn('[Auth] online user record failed:', (err as Error).message)
    }

    return {
      token,
      user: {
        id: user.id, username: user.username, nickname: user.nickname,
        email: user.email, phone: user.phone, avatar: user.avatar,
        status: user.status, userType: user.userType,
      },
    }
  },

  async getUserInfo(userId: number) {
    const user = await prisma.sysUser.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: { permissions: { include: { permission: true } } },
            },
          },
        },
      },
    })
    if (!user) throw createError({ statusCode: 404, message: '用户不存在' })
    const roles = user.roles.map(ur => ur.role.code)
    const permissions = [...new Set(user.roles.flatMap(ur => ur.role.permissions.map(rp => rp.permission.code).filter(Boolean)))] as string[]
    return {
      user: {
        id: user.id, username: user.username, nickname: user.nickname,
        email: user.email, phone: user.phone, avatar: user.avatar,
        status: user.status,
      },
      roles, permissions,
    }
  },

  async getUserMenus(userId: number) {
    const user = await prisma.sysUser.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: { permissions: { include: { permission: true } } },
            },
          },
        },
        menus: { include: { permission: true } },
      },
    })
    if (!user) throw createError({ statusCode: 404, message: '用户不存在' })

    const permSet = new Map<number, any>()
    for (const ur of user.roles) {
      for (const rp of ur.role.permissions) {
        const p = rp.permission
        if (p.status === 1) permSet.set(p.id, p)
      }
    }
    for (const um of user.menus) {
      const p = um.permission
      if (p.status === 1) permSet.set(p.id, p)
    }

    const menuPerms = [...permSet.values()].filter((p: any) => p.type === 0 || p.type === 1)

    function buildTree(perms: any[], parentId: number): any[] {
      return perms
        .filter((p: any) => p.parentId === parentId)
        .sort((a: any, b: any) => a.sort - b.sort)
        .map((p: any) => ({
          id: p.id, name: p.name, code: p.code, type: p.type,
          path: p.path, icon: p.icon, sort: p.sort, visible: p.visible,
          children: buildTree(perms, p.id),
        }))
    }

    return buildTree(menuPerms, 0)
  },

  async updateProfile(userId: number, data: { nickname?: string; email?: string; phone?: string }) {
    const user = await prisma.sysUser.update({ where: { id: userId }, data })
    return {
      id: user.id, username: user.username, nickname: user.nickname,
      email: user.email, phone: user.phone, avatar: user.avatar,
    }
  },

  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    const user = await prisma.sysUser.findUnique({ where: { id: userId } })
    if (!user) throw createError({ statusCode: 404, message: '用户不存在' })
    const valid = await bcrypt.compare(oldPassword, user.password)
    if (!valid) throw createError({ statusCode: 400, message: '旧密码不正确' })
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await prisma.sysUser.update({ where: { id: userId }, data: { password: hashedPassword } })
    return true
  },
}
