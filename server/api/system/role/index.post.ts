import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, code, description, status, sort, remark, permissionIds } = body

  if (!name || !code) {
    throw createError({ statusCode: 400, message: '角色名称和标识不能为空' })
  }

  const exist = await prisma.sysRole.findUnique({ where: { code } })
  if (exist) {
    throw createError({ statusCode: 409, message: '角色标识已存在' })
  }

  const role = await prisma.sysRole.create({
    data: {
      name, code, description, status: status ?? 1, sort: sort ?? 0, remark,
      permissions: permissionIds?.length ? {
        create: permissionIds.map((permissionId: number) => ({ permissionId })),
      } : undefined,
    },
  })

  return { code: 200, msg: '创建成功', data: { id: role.id } }
})
