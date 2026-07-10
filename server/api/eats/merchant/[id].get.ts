import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  const merchant = await prisma.sysMerchant.findUnique({
    where: { id },
    include: {
      category: { select: { name: true } },
      productCategories: {
        where: { status: 1 },
        orderBy: { sort: 'asc' },
      },
      products: {
        where: { status: 1 },
        orderBy: { sort: 'asc' },
        include: {
          category: { select: { name: true } },
          specs: {
            where: { status: 1 },
            orderBy: { sort: 'asc' },
            include: {
              unit: { select: { name: true, symbol: true } },
            },
          },
        },
      },
    },
  })

  if (!merchant) {
    throw createError({ statusCode: 404, message: '商家不存在' })
  }

  const products = merchant.products.map(p => {
    const specs = p.specs.map(s => ({
      id: s.id,
      productId: s.productId,
      name: s.name,
      price: Number(s.price),
      originalPrice: s.originalPrice ? Number(s.originalPrice) : undefined,
      unitId: s.unitId ?? undefined,
      unitName: s.unit?.name,
      unitSymbol: s.unit?.symbol,
      isDefault: s.isDefault,
      stock: s.stock,
      sort: s.sort,
      status: s.status,
    }))
    const prices = specs.map(s => s.price)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    // Use the first spec's unit symbol, default to $
    const sym = specs[0]?.unitSymbol || ''
    const priceRange = prices.length > 1 ? `${sym}${minPrice}-${maxPrice}` : `${sym}${minPrice}`

    return {
      id: p.id,
      name: p.name,
      code: p.code,
      description: p.description,
      image: p.image,
      categoryId: p.categoryId,
      categoryName: p.category?.name,
      merchantId: p.merchantId,
      status: p.status,
      sales: p.sales,
      unit: p.unit,
      isRecommended: p.isRecommended,
      sort: p.sort,
      remark: p.remark,
      specs,
      priceRange,
      createTime: p.createTime,
    }
  })

  const data = {
    id: merchant.id,
    name: merchant.name,
    code: merchant.code,
    description: merchant.description,
    logo: merchant.logo,
    coverImage: merchant.coverImage,
    categoryId: merchant.categoryId,
    categoryName: merchant.category?.name,
    contactName: merchant.contactName,
    contactPhone: merchant.contactPhone,
    address: merchant.address,
    longitude: merchant.longitude ? Number(merchant.longitude) : undefined,
    latitude: merchant.latitude ? Number(merchant.latitude) : undefined,
    status: merchant.status,
    level: merchant.level,
    tags: merchant.tags,
    deliveryFee: merchant.deliveryFee ? Number(merchant.deliveryFee) : undefined,
    minOrderAmount: merchant.minOrderAmount ? Number(merchant.minOrderAmount) : undefined,
    estimatedDeliveryTime: merchant.estimatedDeliveryTime,
    openTime: merchant.openTime,
    closeTime: merchant.closeTime,
    rating: merchant.rating ? Number(merchant.rating) : undefined,
    ratingCount: merchant.ratingCount,
    monthlySales: merchant.monthlySales,
    isFeatured: merchant.isFeatured,
    isNew: merchant.isNew,
    remark: merchant.remark,
    categories: merchant.productCategories,
    products,
    createTime: merchant.createTime,
  }

  return { code: 200, data }
})
