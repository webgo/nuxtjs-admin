import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 10
  const name = query.name as string | undefined
  const categoryId = query.categoryId !== undefined ? Number(query.categoryId) : undefined
  const status = query.status !== undefined ? Number(query.status) : undefined
  const level = query.level !== undefined ? Number(query.level) : undefined
  const isFeatured = query.isFeatured !== undefined ? Number(query.isFeatured) : undefined
  const keyword = query.keyword as string | undefined

  const where: any = {}
  if (name) where.name = { contains: name }
  if (categoryId !== undefined) where.categoryId = categoryId
  if (status !== undefined) where.status = status
  if (level !== undefined) where.level = level
  if (isFeatured !== undefined) where.isFeatured = isFeatured
  if (keyword) {
    where.OR = [
      { name: { contains: keyword } },
      { description: { contains: keyword } },
      { address: { contains: keyword } },
    ]
  }

  const orderBy: any = { createTime: 'desc' }

  const [rows, total] = await Promise.all([
    prisma.sysMerchant.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy,
      include: {
        category: { select: { name: true } },
        region: { select: { id: true, name: true, nameEn: true, nameJp: true, parentId: true, level: true } },
      },
    }),
    prisma.sysMerchant.count({ where }),
  ])

  const list = rows.map(m => ({
    id: m.id,
    name: m.name,
    code: m.code,
    description: m.description,
    logo: m.logo,
    coverImage: m.coverImage,
    categoryId: m.categoryId,
    categoryName: m.category?.name,
    regionId: m.regionId,
    regionName: m.region
      ? (m.region.nameEn || m.region.nameJp || m.region.name)
      : undefined,
    contactName: m.contactName,
    contactPhone: m.contactPhone,
    address: m.address,
    longitude: m.longitude ? Number(m.longitude) : undefined,
    latitude: m.latitude ? Number(m.latitude) : undefined,
    status: m.status,
    level: m.level,
    tags: m.tags,
    deliveryFee: m.deliveryFee ? Number(m.deliveryFee) : undefined,
    minOrderAmount: m.minOrderAmount ? Number(m.minOrderAmount) : undefined,
    estimatedDeliveryTime: m.estimatedDeliveryTime,
    openTime: m.openTime,
    closeTime: m.closeTime,
    rating: m.rating ? Number(m.rating) : undefined,
    ratingCount: m.ratingCount,
    monthlySales: m.monthlySales,
    isFeatured: m.isFeatured,
    isNew: m.isNew,
    remark: m.remark,
    createTime: m.createTime,
    updateTime: m.updateTime,
  }))

  return { code: 200, data: { list, total, page, pageSize } }
})
