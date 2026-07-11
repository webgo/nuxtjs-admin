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

  const body = await readBody(event)
  const { name, phone, detail, label, province, city, district, isDefault } = body

  const data: Record<string, unknown> = {}
  if (name !== undefined) data.name = name
  if (phone !== undefined) data.phone = phone
  if (detail !== undefined) data.detail = detail
  if (label !== undefined) data.label = label || null
  if (province !== undefined) data.province = province || null
  if (city !== undefined) data.city = city || null
  if (district !== undefined) data.district = district || null
  if (isDefault !== undefined) data.isDefault = isDefault

  if (isDefault === 1) {
    await prisma.sysUserAddress.updateMany({
      where: { userId: auth.userId, isDefault: 1, id: { not: id } },
      data: { isDefault: 0 },
    })
  }

  const address = await prisma.sysUserAddress.update({
    where: { id },
    data,
  })

  return { code: 200, msg: '更新成功', data: address }
})
