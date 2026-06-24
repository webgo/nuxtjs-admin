import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const { name, code, description, status, sort, remark, permissionIds } = body

  const role = await prisma.sysRole.findUnique({ where: { id } })
  if (!role) {
    throw createError({ statusCode: 404, message: '角色不存在' })
  }

  // 禁止修改超级管理员角色
  if (role.code === 'admin') {
    throw createError({ statusCode: 400, message: '不能修改超级管理员角色' })
  }

  const data: any = {}
  if (name !== undefined) data.name = name
  if (code !== undefined) data.code = code
  if (description !== undefined) data.description = description
  if (status !== undefined) data.status = status
  if (sort !== undefined) data.sort = sort
  if (remark !== undefined) data.remark = remark

  // 更新权限关联
  if (permissionIds !== undefined) {
    await prisma.sysRolePermission.deleteMany({ where: { roleId: id } })
    if (permissionIds.length > 0) {
      await prisma.sysRolePermission.createMany({
        data: permissionIds.map((permissionId: number) => ({ roleId: id, permissionId })),
      })
    }
  }

  await prisma.sysRole.update({ where: { id }, data })

  return { code: 200, msg: '更新成功' }
})
