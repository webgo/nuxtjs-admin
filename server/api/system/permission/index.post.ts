import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, code, type, parentId, path, component, icon, sort, status, visible, remark } = body

  if (!name) {
    throw createError({ statusCode: 400, message: '菜单名称不能为空' })
  }

  const permission = await prisma.sysPermission.create({
    data: {
      name,
      code,
      type: type ?? 1,
      parentId: parentId ?? 0,
      path,
      component,
      icon,
      sort: sort ?? 0,
      status: status ?? 1,
      visible: visible ?? 1,
      remark,
    },
  })

  return { code: 200, msg: '创建成功', data: { id: permission.id } }
})
