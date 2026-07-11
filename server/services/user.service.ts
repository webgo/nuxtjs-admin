import bcrypt from 'bcryptjs'
import prisma from '../utils/prisma'

export const userService = {
  async list(params: { page: number; pageSize: number; username?: string; status?: number }) {
    const { page, pageSize, username, status } = params
    const where: Record<string, unknown> = {}
    if (username) where.username = { contains: username }
    if (status !== undefined) where.status = status

    const [rows, total] = await Promise.all([
      prisma.sysUser.findMany({
        where, skip: (page - 1) * pageSize, take: pageSize,
        orderBy: [{ createTime: 'desc' }],
        include: { roles: { include: { role: true } } },
      }),
      prisma.sysUser.count({ where }),
    ])

    const list = rows.map(u => ({
      id: u.id, username: u.username, nickname: u.nickname,
      email: u.email, phone: u.phone, avatar: u.avatar,
      status: u.status, userType: u.userType, remark: u.remark, createTime: u.createTime, updateTime: u.updateTime,
      roles: u.roles.map(ur => ({ id: ur.role.id, name: ur.role.name, code: ur.role.code })),
    }))
    return { list, total, page, pageSize }
  },

  async findById(id: number) {
    const user = await prisma.sysUser.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    })
    if (!user) throw createError({ statusCode: 404, message: '用户不存在' })
    return {
      id: user.id, username: user.username, nickname: user.nickname,
      email: user.email, phone: user.phone, avatar: user.avatar,
      status: user.status, userType: user.userType, remark: user.remark, createTime: user.createTime, updateTime: user.updateTime,
      roles: user.roles.map(ur => ({ id: ur.role.id, name: ur.role.name, code: ur.role.code })),
    }
  },

  async create(params: { username: string; nickname?: string; email?: string; phone?: string; password: string; status?: number; userType?: number; remark?: string; roleIds?: number[] }) {
    const { username, nickname, email, phone, password, status, userType, remark, roleIds } = params
    const existing = await prisma.sysUser.findUnique({ where: { username } })
    if (existing) throw createError({ statusCode: 409, message: '用户名已存在' })

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.sysUser.create({
      data: {
        username, nickname: nickname || username, email: email || `${username}@placeholder.com`,
        phone: phone || null, password: hashedPassword, status: status ?? 1,
        userType: userType ?? 0, remark: remark || null,
        roles: roleIds?.length ? { create: roleIds.map(roleId => ({ roleId })) } : undefined,
      },
    })
    return { id: user.id, username: user.username, nickname: user.nickname, email: user.email, phone: user.phone, avatar: user.avatar, status: user.status, createTime: user.createTime }
  },

  async update(id: number, params: { nickname?: string; email?: string; phone?: string; status?: number; userType?: number; remark?: string; roleIds?: number[] }) {
    const { nickname, email, phone, status, userType, remark, roleIds } = params
    const user = await prisma.sysUser.findUnique({ where: { id } })
    if (!user) throw createError({ statusCode: 404, message: '用户不存在' })

    await prisma.sysUser.update({
      where: { id },
      data: { nickname: nickname ?? undefined, email: email ?? undefined, phone: phone ?? undefined, status: status ?? undefined, userType: userType ?? undefined, remark: remark ?? undefined },
    })

    if (roleIds !== undefined) {
      await prisma.sysUserRole.deleteMany({ where: { userId: id } })
      if (roleIds.length > 0) {
        await prisma.sysUserRole.createMany({ data: roleIds.map(roleId => ({ userId: id, roleId })) })
      }
    }
    return this.findById(id)
  },

  async delete(id: number) {
    const user = await prisma.sysUser.findUnique({ where: { id } })
    if (!user) throw createError({ statusCode: 404, message: '用户不存在' })
    if (user.username === 'admin') throw createError({ statusCode: 400, message: '不能删除超级管理员' })
    await prisma.sysUserRole.deleteMany({ where: { userId: id } })
    await prisma.sysUser.delete({ where: { id } })
    return true
  },

  async updateAvatar(userId: number, avatarUrl: string) {
    await prisma.sysUser.update({ where: { id: userId }, data: { avatar: avatarUrl } })
    return { avatar: avatarUrl }
  },
}
