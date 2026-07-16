import bcrypt from 'bcryptjs'
import db from '../utils/db'
import { sysUser, sysUserRole, sysRole } from '../../db/schema'
import { eq, like, desc, and, count as drizzleCount } from 'drizzle-orm'

async function findUserWithRoles(userId: number) {
  const [user] = await db.select().from(sysUser).where(eq(sysUser.id, userId))
  if (!user) return null

  const userRoles = await db.select({
    roleId: sysUserRole.roleId,
    roleName: sysRole.name,
    roleCode: sysRole.code,
  }).from(sysUserRole)
    .innerJoin(sysRole, eq(sysUserRole.roleId, sysRole.id))
    .where(eq(sysUserRole.userId, userId))

  return {
    ...user,
    roles: userRoles.map(ur => ({ id: ur.roleId, name: ur.roleName, code: ur.roleCode })),
  }
}

export const userService = {
  async list(params: { page: number; pageSize: number; username?: string; status?: number }) {
    const { page, pageSize, username, status } = params
    const conditions: ReturnType<typeof eq>[] = []
    if (username) conditions.push(like(sysUser.username, `%${username}%`))
    if (status !== undefined) conditions.push(eq(sysUser.status, status))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [rows, countResult] = await Promise.all([
      db.select().from(sysUser)
        .where(where)
        .orderBy(desc(sysUser.createTime))
        .offset((page - 1) * pageSize)
        .limit(pageSize),
      db.select({ count: drizzleCount() }).from(sysUser).where(where),
    ])

    const list = await Promise.all(rows.map(async (u) => {
      const userRoles = await db.select({
        roleId: sysUserRole.roleId,
        roleName: sysRole.name,
        roleCode: sysRole.code,
      }).from(sysUserRole)
        .innerJoin(sysRole, eq(sysUserRole.roleId, sysRole.id))
        .where(eq(sysUserRole.userId, u.id))

      return {
        id: u.id, username: u.username, nickname: u.nickname,
        email: u.email, phone: u.phone, avatar: u.avatar,
        status: u.status, userType: u.userType, remark: u.remark,
        createTime: u.createTime, updateTime: u.updateTime,
        roles: userRoles.map(ur => ({ id: ur.roleId, name: ur.roleName, code: ur.roleCode })),
      }
    }))
    return { list, total: countResult[0]?.count ?? 0, page, pageSize }
  },

  async findById(id: number) {
    const user = await findUserWithRoles(id)
    if (!user) throw createError({ statusCode: 404, message: '用户不存在' })
    return user
  },

  async create(params: { username: string; nickname?: string; email?: string; phone?: string; password: string; status?: number; userType?: number; remark?: string; roleIds?: number[] }) {
    const { username, nickname, email, phone, password, status, userType, remark, roleIds } = params
    const [existing] = await db.select().from(sysUser).where(eq(sysUser.username, username))
    if (existing) throw createError({ statusCode: 409, message: '用户名已存在' })

    const hashedPassword = await bcrypt.hash(password, 10)
    const now = new Date().toISOString().slice(0, 23).replace('T', ' ')
    const [result] = await db.insert(sysUser).values({
      username, nickname: nickname || username, email: email || `${username}@placeholder.com`,
      phone: phone || null, password: hashedPassword, status: status ?? 1,
      userType: userType ?? 0, remark: remark || null, updateTime: now,
    })
    const userId = Number(result.insertId)

    if (roleIds?.length) {
      await db.insert(sysUserRole).values(roleIds.map(roleId => ({ userId, roleId })))
    }

    return { id: userId, username, nickname: nickname || username, email: email || `${username}@placeholder.com`, phone: phone || null, avatar: null, status: status ?? 1, createTime: now }
  },

  async update(id: number, params: { nickname?: string; email?: string; phone?: string; status?: number; userType?: number; remark?: string; roleIds?: number[] }) {
    const { nickname, email, phone, status, userType, remark, roleIds } = params
    const user = await this.findById(id)

    const updateData: Record<string, unknown> = {}
    if (nickname !== undefined) updateData.nickname = nickname
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (status !== undefined) updateData.status = status
    if (userType !== undefined) updateData.userType = userType
    if (remark !== undefined) updateData.remark = remark
    if (Object.keys(updateData).length > 0) {
      await db.update(sysUser).set(updateData).where(eq(sysUser.id, id))
    }

    if (roleIds !== undefined) {
      await db.delete(sysUserRole).where(eq(sysUserRole.userId, id))
      if (roleIds.length > 0) {
        await db.insert(sysUserRole).values(roleIds.map(roleId => ({ userId: id, roleId })))
      }
    }
    return this.findById(id)
  },

  async delete(id: number) {
    const user = await this.findById(id)
    if (user.username === 'admin') throw createError({ statusCode: 400, message: '不能删除超级管理员' })
    await db.delete(sysUserRole).where(eq(sysUserRole.userId, id))
    await db.delete(sysUser).where(eq(sysUser.id, id))
    return true
  },

  async updateAvatar(userId: number, avatarUrl: string) {
    await db.update(sysUser).set({ avatar: avatarUrl }).where(eq(sysUser.id, userId))
    return { avatar: avatarUrl }
  },
}
