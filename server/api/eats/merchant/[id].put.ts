import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  const record = await prisma.sysMerchant.findUnique({ where: { id } })
  if (!record) {
    throw createError({ statusCode: 404, message: '商家不存在' })
  }

  const { name, code, categoryId, regionId, description, logo, coverImage, contactName, contactPhone,
    address, longitude, latitude, status, level, tags, deliveryFee, minOrderAmount,
    estimatedDeliveryTime, openTime, closeTime, isFeatured, isNew, remark } = body

  if (code && code !== record.code) {
    const exist = await prisma.sysMerchant.findUnique({ where: { code } })
    if (exist) {
      throw createError({ statusCode: 409, message: '商家编码已存在' })
    }
  }

  await prisma.sysMerchant.update({
    where: { id },
    data: {
      name, code, categoryId, regionId: regionId || null, description, logo, coverImage,
      contactName, contactPhone, address, longitude, latitude,
      status, level, tags, deliveryFee, minOrderAmount,
      estimatedDeliveryTime, openTime, closeTime,
      isFeatured, isNew, remark,
    },
  })

  return { code: 200, msg: '更新成功' }
})
