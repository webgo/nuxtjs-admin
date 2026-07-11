import prisma from '../utils/prisma'

export const roleService = {
  async list(params: { page: number; pageSize: number; name?: string; code?: string; status?: number }) {
    const { page, pageSize, name, code, status } = params
    const where: Record<string, unknown> = {}
    if (name) where.name = { contains: name }
    if (code) where.code = { contains: code }
    if (status !== undefined) where.status = status

    const [rows, total] = await Promise.all([
      prisma.sysRole.findMany({
        where, skip: (page - 1) * pageSize, take: pageSize,
        orderBy: [{ sort: 'asc' }],
        include: { _count: { select: { users: true } } },
      }),
      prisma.sysRole.count({ where }),
    ])

    const list = rows.map(r => ({
      id: r.id, name: r.name, code: r.code, description: r.description,
      status: r.status, sort: r.sort, remark: r.remark,
      createTime: r.createTime, updateTime: r.updateTime,
      userCount: r._count.users,
    }))
    return { list, total, page, pageSize }
  },

  async findAll() {
    return prisma.sysRole.findMany({
      where: { status: 1 }, orderBy: [{ sort: 'asc' }],
      select: { id: true, name: true, code: true },
    })
  },

  async findById(id: number) {
    const role = await prisma.sysRole.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } },
    })
    if (!role) throw createError({ statusCode: 404, message: '角色不存在' })
    return {
      id: role.id, name: role.name, code: role.code, description: role.description,
      status: role.status, sort: role.sort, remark: role.remark,
      createTime: role.createTime, updateTime: role.updateTime,
      permissionIds: role.permissions.map(rp => rp.permissionId),
    }
  },

  async create(params: { name: string; code: string; description?: string; status?: number; sort?: number; remark?: string; permissionIds?: number[] }) {
    const { name, code, description, status, sort, remark, permissionIds } = params
    const existing = await prisma.sysRole.findUnique({ where: { code } })
    if (existing) throw createError({ statusCode: 409, message: '角色编码已存在' })

    const role = await prisma.sysRole.create({
      data: {
        name, code, description: description || null, status: status ?? 1, sort: sort ?? 0, remark: remark || null,
        permissions: permissionIds?.length ? { create: permissionIds.map(permissionId => ({ permissionId })) } : undefined,
      },
    })
    return { id: role.id, name: role.name, code: role.code }
  },

  async update(id: number, params: { name?: string; code?: string; description?: string; status?: number; sort?: number; remark?: string; permissionIds?: number[] }) {
    const { name, code, description, status, sort, remark, permissionIds } = params
    const role = await prisma.sysRole.findUnique({ where: { id } })
    if (!role) throw createError({ statusCode: 404, message: '角色不存在' })

    if (code && code !== role.code) {
      const existing = await prisma.sysRole.findUnique({ where: { code } })
      if (existing) throw createError({ statusCode: 409, message: '角色编码已存在' })
    }

    await prisma.sysRole.update({
      where: { id },
      data: { name: name ?? undefined, code: code ?? undefined, description: description ?? undefined, status: status ?? undefined, sort: sort ?? undefined, remark: remark ?? undefined },
    })

    if (permissionIds !== undefined) {
      await prisma.sysRolePermission.deleteMany({ where: { roleId: id } })
      if (permissionIds.length > 0) {
        await prisma.sysRolePermission.createMany({ data: permissionIds.map(permissionId => ({ roleId: id, permissionId })) })
      }
    }
    return this.findById(id)
  },

  async delete(id: number) {
    const role = await prisma.sysRole.findUnique({ where: { id } })
    if (!role) throw createError({ statusCode: 404, message: '角色不存在' })
    const userCount = await prisma.sysUserRole.count({ where: { roleId: id } })
    if (userCount > 0) throw createError({ statusCode: 400, message: '该角色下有用户，不能删除' })
    await prisma.sysRolePermission.deleteMany({ where: { roleId: id } })
    await prisma.sysRole.delete({ where: { id } })
    return true
  },
}
