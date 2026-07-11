import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) throw createError({ statusCode: 401, message: '未认证' })

  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, message: '无效地址 ID' })

  const existing = await prisma.sysUserAddress.findFirst({
    where: { id, userId: auth.userId },
  })
  if (!existing) throw createError({ statusCode: 404, message: '地址不存在' })

  await prisma.sysUserAddress.delete({ where: { id } })

  return { code: 200, msg: '删除成功' }
})
