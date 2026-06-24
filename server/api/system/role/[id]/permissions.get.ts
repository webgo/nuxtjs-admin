import prisma from '../../../../utils/prisma'

// GET /api/system/role/:id/permissions - 获取角色的权限ID列表
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  // 超级管理员角色拥有所有权限
  const role = await prisma.sysRole.findUnique({ where: { id } })
  if (role?.code === 'admin') {
    const allPermissions = await prisma.sysPermission.findMany({
      select: { id: true },
    })
    return {
      code: 200,
      data: allPermissions.map(p => p.id),
    }
  }

  const permissions = await prisma.sysRolePermission.findMany({
    where: { roleId: id },
    select: { permissionId: true },
  })

  return {
    code: 200,
    data: permissions.map(p => p.permissionId),
  }
})
