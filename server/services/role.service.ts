import db from '../utils/db'
import { sysRole, sysUserRole, sysRolePermission, sysPermission } from '../../db/schema'
import { eq, like, asc, and, count as drizzleCount } from 'drizzle-orm'

export const roleService = {
  async list(params: { page: number; pageSize: number; name?: string; code?: string; status?: number }) {
    const { page, pageSize, name, code, status } = params
    const conditions: ReturnType<typeof eq>[] = []
    if (name) conditions.push(like(sysRole.name, `%${name}%`))
    if (code) conditions.push(like(sysRole.code, `%${code}%`))
    if (status !== undefined) conditions.push(eq(sysRole.status, status))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [rows, countResult] = await Promise.all([
      db.select({
        id: sysRole.id, name: sysRole.name, code: sysRole.code,
        description: sysRole.description, status: sysRole.status,
        sort: sysRole.sort, remark: sysRole.remark,
        createTime: sysRole.createTime, updateTime: sysRole.updateTime,
        userCount: drizzleCount(sysUserRole.userId),
      }).from(sysRole)
        .leftJoin(sysUserRole, eq(sysRole.id, sysUserRole.roleId))
        .where(where)
        .orderBy(asc(sysRole.sort))
        .groupBy(sysRole.id)
        .offset((page - 1) * pageSize)
        .limit(pageSize),
      db.select({ count: drizzleCount() }).from(sysRole).where(where),
    ])
    return { list: rows, total: countResult[0]?.count ?? 0, page, pageSize }
  },

  async findAll() {
    return db.select({ id: sysRole.id, name: sysRole.name, code: sysRole.code })
      .from(sysRole)
      .where(eq(sysRole.status, 1))
      .orderBy(asc(sysRole.sort))
  },

  async findById(id: number) {
    const [role] = await db.select().from(sysRole).where(eq(sysRole.id, id))
    if (!role) throw createError({ statusCode: 404, message: '角色不存在' })

    const rolePermissions = await db.select({ permissionId: sysRolePermission.permissionId })
      .from(sysRolePermission)
      .where(eq(sysRolePermission.roleId, id))

    return {
      ...role,
      permissionIds: rolePermissions.map(rp => rp.permissionId),
    }
  },

  async create(params: { name: string; code: string; description?: string; status?: number; sort?: number; remark?: string; permissionIds?: number[] }) {
    const { name, code, description, status, sort, remark, permissionIds } = params
    const [existing] = await db.select().from(sysRole).where(eq(sysRole.code, code))
    if (existing) throw createError({ statusCode: 409, message: '角色编码已存在' })

    const now = new Date().toISOString().slice(0, 23).replace('T', ' ')
    const [result] = await db.insert(sysRole).values({
      name, code, description: description || null, status: status ?? 1,
      sort: sort ?? 0, remark: remark || null, updateTime: now,
    })
    const roleId = Number(result.insertId)

    if (permissionIds?.length) {
      await db.insert(sysRolePermission).values(permissionIds.map(permissionId => ({ roleId, permissionId })))
    }

    return { id: roleId, name, code }
  },

  async update(id: number, params: { name?: string; code?: string; description?: string; status?: number; sort?: number; remark?: string; permissionIds?: number[] }) {
    const { name, code, description, status, sort, remark, permissionIds } = params
    const role = await this.findById(id)

    if (code && code !== role.code) {
      const [existing] = await db.select().from(sysRole).where(eq(sysRole.code, code))
      if (existing) throw createError({ statusCode: 409, message: '角色编码已存在' })
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (code !== undefined) updateData.code = code
    if (description !== undefined) updateData.description = description
    if (status !== undefined) updateData.status = status
    if (sort !== undefined) updateData.sort = sort
    if (remark !== undefined) updateData.remark = remark
    if (Object.keys(updateData).length > 0) {
      await db.update(sysRole).set(updateData).where(eq(sysRole.id, id))
    }

    if (permissionIds !== undefined) {
      await db.delete(sysRolePermission).where(eq(sysRolePermission.roleId, id))
      if (permissionIds.length > 0) {
        await db.insert(sysRolePermission).values(permissionIds.map(permissionId => ({ roleId: id, permissionId })))
      }
    }
    return this.findById(id)
  },

  async delete(id: number) {
    const role = await this.findById(id)
    const [userCountResult] = await db.select({ count: drizzleCount() }).from(sysUserRole).where(eq(sysUserRole.roleId, id))
    const userCount = userCountResult?.count ?? 0
    if (userCount > 0) throw createError({ statusCode: 400, message: '该角色下有用户，不能删除' })
    await db.delete(sysRolePermission).where(eq(sysRolePermission.roleId, id))
    await db.delete(sysRole).where(eq(sysRole.id, id))
    return true
  },
}
