import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, code, categoryId, regionId, description, logo, coverImage, contactName, contactPhone,
    address, longitude, latitude, status, level, tags, deliveryFee, minOrderAmount,
    estimatedDeliveryTime, openTime, closeTime, isFeatured, isNew, remark } = body

  if (!name || !code || !categoryId) {
    throw createError({ statusCode: 400, message: '名称、编码和分类不能为空' })
  }

  const exist = await prisma.sysMerchant.findUnique({ where: { code } })
  if (exist) {
    throw createError({ statusCode: 409, message: '商家编码已存在' })
  }

  const category = await prisma.sysMerchantCategory.findUnique({ where: { id: categoryId } })
  if (!category) {
    throw createError({ statusCode: 404, message: '商家分类不存在' })
  }

  const record = await prisma.sysMerchant.create({
    data: {
      name, code, categoryId, regionId: regionId || null,
      description, logo, coverImage, contactName, contactPhone,
      address, longitude, latitude,
      status: status ?? 1, level: level ?? 0,
      tags, deliveryFee, minOrderAmount, estimatedDeliveryTime,
      openTime, closeTime, isFeatured: isFeatured ?? 0, isNew: isNew ?? 0, remark,
    },
  })

  return { code: 200, msg: '创建成功', data: { id: record.id } }
})
