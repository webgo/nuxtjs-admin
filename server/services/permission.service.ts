import db from '../utils/db'
import { sysPermission, sysUserRole, sysRole, sysRolePermission } from '../../db/schema'
import { eq, asc, and, inArray, count as drizzleCount } from 'drizzle-orm'

export const permissionService = {
  async tree() {
    const permissions = await db.select().from(sysPermission).orderBy(asc(sysPermission.sort))
    const map = new Map<number, PermissionNode & { children: PermissionNode[] }>()
    const roots: PermissionNode[] = []

    for (const p of permissions) {
      map.set(p.id, { ...p, children: [] })
    }
    for (const p of permissions) {
      const node = map.get(p.id)!
      if (p.parentId && map.has(p.parentId)) {
        map.get(p.parentId)!.children.push(node)
      } else {
        roots.push(node)
      }
    }
    return roots
  },

  async findById(id: number) {
    const [permission] = await db.select().from(sysPermission).where(eq(sysPermission.id, id))
    if (!permission) throw createError({ statusCode: 404, message: '权限不存在' })
    return permission
  },

  async create(params: { parentId: number | null; name: string; type: 0 | 1 | 2; path?: string; component?: string; code?: string; icon?: string; status?: number; sort?: number }) {
    const { parentId, name, type, path, component, code, icon, status, sort } = params
    if (parentId) {
      const [parent] = await db.select().from(sysPermission).where(eq(sysPermission.id, parentId))
      if (!parent) throw createError({ statusCode: 400, message: '父权限不存在' })
    }
    if (type === 2 && code) {
      const [existing] = await db.select().from(sysPermission)
        .where(and(eq(sysPermission.code, code), eq(sysPermission.type, 2)))
      if (existing) throw createError({ statusCode: 409, message: '权限编码已存在' })
    }

    const now = new Date().toISOString().slice(0, 23).replace('T', ' ')
    const [result] = await db.insert(sysPermission).values({
      parentId: parentId || null, name, type, path: path || null,
      component: component || null, code: code || null, icon: icon || null,
      status: status ?? 1, sort: sort ?? 0, updateTime: now,
    })
    return { id: Number(result.insertId), ...params }
  },

  async update(id: number, params: { parentId?: number | null; name?: string; type?: 0 | 1 | 2; path?: string; component?: string; code?: string; icon?: string; status?: number; sort?: number }) {
    const permission = await this.findById(id)
    if (params.parentId === id) throw createError({ statusCode: 400, message: '不能将自己设为自己的子节点' })

    const updateData: Record<string, unknown> = { ...params }
    await db.update(sysPermission).set(updateData).where(eq(sysPermission.id, id))
    return this.findById(id)
  },

  async delete(id: number) {
    const permission = await this.findById(id)
    const [childCountResult] = await db.select({ count: drizzleCount() }).from(sysPermission).where(eq(sysPermission.parentId, id))
    const childCount = childCountResult?.count ?? 0
    if (childCount > 0) throw createError({ statusCode: 400, message: '该权限下有子节点，不能删除' })
    await db.delete(sysRolePermission).where(eq(sysRolePermission.permissionId, id))
    await db.delete(sysPermission).where(eq(sysPermission.id, id))
    return true
  },

  async getMenus(userId: number) {
    const userRoles = await db.select({
      roleId: sysUserRole.roleId,
      roleCode: sysRole.code,
    }).from(sysUserRole)
      .innerJoin(sysRole, eq(sysUserRole.roleId, sysRole.id))
      .where(eq(sysUserRole.userId, userId))

    if (userRoles.some(ur => ur.roleCode === 'admin')) {
      return db.select().from(sysPermission)
        .where(and(eq(sysPermission.status, 1), inArray(sysPermission.type, [0, 1])))
        .orderBy(asc(sysPermission.sort))
    }

    const roleIds = userRoles.map(ur => ur.roleId)
    const rolePermissions = await db.select({ permissionId: sysRolePermission.permissionId })
      .from(sysRolePermission)
      .where(inArray(sysRolePermission.roleId, roleIds))
    const permissionIds = [...new Set(rolePermissions.map(rp => rp.permissionId))]

    return db.select().from(sysPermission)
      .where(and(
        inArray(sysPermission.id, permissionIds),
        eq(sysPermission.status, 1),
        inArray(sysPermission.type, [0, 1]),
      ))
      .orderBy(asc(sysPermission.sort))
  },

  async getButtonPermissions(userId: number) {
    const userRoles = await db.select({
      roleId: sysUserRole.roleId,
      roleCode: sysRole.code,
    }).from(sysUserRole)
      .innerJoin(sysRole, eq(sysUserRole.roleId, sysRole.id))
      .where(eq(sysUserRole.userId, userId))

    if (userRoles.some(ur => ur.roleCode === 'admin')) {
      return db.select({ code: sysPermission.code }).from(sysPermission)
        .where(and(eq(sysPermission.status, 1), eq(sysPermission.type, 2)))
    }

    const roleIds = userRoles.map(ur => ur.roleId)
    const rolePermissions = await db.select({ permissionId: sysRolePermission.permissionId })
      .from(sysRolePermission)
      .where(inArray(sysRolePermission.roleId, roleIds))
    const permissionIds = [...new Set(rolePermissions.map(rp => rp.permissionId))]

    return db.select({ code: sysPermission.code }).from(sysPermission)
      .where(and(
        inArray(sysPermission.id, permissionIds),
        eq(sysPermission.status, 1),
        eq(sysPermission.type, 2),
      ))
  },
}

interface PermissionNode {
  id: number; parentId: number | null; name: string; type: number
  path: string | null; component: string | null; code: string | null
  icon: string | null; status: number; sort: number; children: PermissionNode[]
}
