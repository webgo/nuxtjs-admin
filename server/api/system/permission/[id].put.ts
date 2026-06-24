import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const { name, code, type, parentId, path, component, icon, sort, status, visible, remark } = body

  const perm = await prisma.sysPermission.findUnique({ where: { id } })
  if (!perm) {
    throw createError({ statusCode: 404, message: '菜单不存在' })
  }

  // 检查不能将自己设为父菜单
  if (parentId === id) {
    throw createError({ statusCode: 400, message: '不能将自身设为父菜单' })
  }

  const data: any = {}
  if (name !== undefined) data.name = name
  if (code !== undefined) data.code = code
  if (type !== undefined) data.type = type
  if (parentId !== undefined) data.parentId = parentId
  if (path !== undefined) data.path = path
  if (component !== undefined) data.component = component
  if (icon !== undefined) data.icon = icon
  if (sort !== undefined) data.sort = sort
  if (status !== undefined) data.status = status
  if (visible !== undefined) data.visible = visible
  if (remark !== undefined) data.remark = remark

  await prisma.sysPermission.update({ where: { id }, data })

  return { code: 200, msg: '更新成功' }
})
