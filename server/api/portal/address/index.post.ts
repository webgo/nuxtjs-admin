import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) throw createError({ statusCode: 401, message: '未认证' })

  const body = await readBody(event)
  const { name, phone, detail, label, province, city, district, isDefault } = body

  if (!name || !phone || !detail) {
    throw createError({ statusCode: 400, message: '收件人、电话和详细地址为必填' })
  }

  if (isDefault === 1) {
    await prisma.sysUserAddress.updateMany({
      where: { userId: auth.userId, isDefault: 1 },
      data: { isDefault: 0 },
    })
  }

  const address = await prisma.sysUserAddress.create({
    data: {
      userId: auth.userId,
      label: label || null,
      name,
      phone,
      province: province || null,
      city: city || null,
      district: district || null,
      detail,
      isDefault: isDefault || 0,
    },
  })

  return { code: 200, msg: '添加成功', data: address }
})
