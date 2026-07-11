import prisma from '../utils/prisma'

export const permissionService = {
  async tree() {
    const permissions = await prisma.sysPermission.findMany({ orderBy: [{ sort: 'asc' }] })
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
    const permission = await prisma.sysPermission.findUnique({ where: { id } })
    if (!permission) throw createError({ statusCode: 404, message: '权限不存在' })
    return permission
  },

  async create(params: { parentId: number | null; name: string; type: 0 | 1 | 2; path?: string; component?: string; code?: string; icon?: string; status?: number; sort?: number }) {
    const { parentId, name, type, path, component, code, icon, status, sort } = params
    if (parentId) {
      const parent = await prisma.sysPermission.findUnique({ where: { id: parentId } })
      if (!parent) throw createError({ statusCode: 400, message: '父权限不存在' })
    }
    if (type === 2 && code) {
      const existing = await prisma.sysPermission.findFirst({ where: { code, type: 2 } })
      if (existing) throw createError({ statusCode: 409, message: '权限编码已存在' })
    }

    return prisma.sysPermission.create({
      data: { parentId: parentId || null, name, type, path: path || null, component: component || null, code: code || null, icon: icon || null, status: status ?? 1, sort: sort ?? 0 },
    })
  },

  async update(id: number, params: { parentId?: number | null; name?: string; type?: 0 | 1 | 2; path?: string; component?: string; code?: string; icon?: string; status?: number; sort?: number }) {
    const permission = await prisma.sysPermission.findUnique({ where: { id } })
    if (!permission) throw createError({ statusCode: 404, message: '权限不存在' })
    if (params.parentId === id) throw createError({ statusCode: 400, message: '不能将自己设为自己的子节点' })

    await prisma.sysPermission.update({
      where: { id },
      data: { ...params, parentId: params.parentId ?? undefined },
    })
    return this.findById(id)
  },

  async delete(id: number) {
    const permission = await prisma.sysPermission.findUnique({ where: { id } })
    if (!permission) throw createError({ statusCode: 404, message: '权限不存在' })
    const childCount = await prisma.sysPermission.count({ where: { parentId: id } })
    if (childCount > 0) throw createError({ statusCode: 400, message: '该权限下有子节点，不能删除' })
    await prisma.sysRolePermission.deleteMany({ where: { permissionId: id } })
    await prisma.sysPermission.delete({ where: { id } })
    return true
  },

  async getMenus(userId: number) {
    const userRoles = await prisma.sysUserRole.findMany({ where: { userId }, include: { role: true } })
    if (userRoles.some(ur => ur.role.code === 'admin')) {
      return prisma.sysPermission.findMany({ where: { status: 1, type: { in: [0, 1] } }, orderBy: [{ sort: 'asc' }] })
    }
    const roleIds = userRoles.map(ur => ur.roleId)
    const rolePermissions = await prisma.sysRolePermission.findMany({ where: { roleId: { in: roleIds } } })
    const permissionIds = [...new Set(rolePermissions.map(rp => rp.permissionId))]
    return prisma.sysPermission.findMany({ where: { id: { in: permissionIds }, status: 1, type: { in: [0, 1] } }, orderBy: [{ sort: 'asc' }] })
  },

  async getButtonPermissions(userId: number) {
    const userRoles = await prisma.sysUserRole.findMany({ where: { userId }, include: { role: true } })
    if (userRoles.some(ur => ur.role.code === 'admin')) {
      return prisma.sysPermission.findMany({ where: { status: 1, type: 2 }, select: { code: true } })
    }
    const roleIds = userRoles.map(ur => ur.roleId)
    const rolePermissions = await prisma.sysRolePermission.findMany({ where: { roleId: { in: roleIds } } })
    const permissionIds = [...new Set(rolePermissions.map(rp => rp.permissionId))]
    return prisma.sysPermission.findMany({ where: { id: { in: permissionIds }, status: 1, type: 2 }, select: { code: true } })
  },
}

interface PermissionNode {
  id: number; parentId: number | null; name: string; type: number
  path: string | null; component: string | null; code: string | null
  icon: string | null; status: number; sort: number; children: PermissionNode[]
}
