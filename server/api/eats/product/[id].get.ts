import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  const product = await prisma.sysProduct.findUnique({
    where: { id },
      include: {
        category: { select: { name: true } },
        merchant: { select: { name: true } },
        specs: {
          where: { status: 1 },
          orderBy: { sort: 'asc' },
          include: {
            unit: { select: { name: true, symbol: true } },
          },
        },
      },
  })

  if (!product) {
    throw createError({ statusCode: 404, message: '商品不存在' })
  }

  const specs = product.specs.map(s => ({
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
  const sym = specs.find(s => s.unitSymbol)?.unitSymbol || ''
  const priceRange = prices.length > 1 ? `${sym}${minPrice}-${maxPrice}` : `${sym}${minPrice}`

  return {
    code: 200,
    data: {
      id: product.id,
      name: product.name,
      code: product.code,
      description: product.description,
      image: product.image,
      categoryId: product.categoryId,
      categoryName: product.category?.name,
      merchantId: product.merchantId,
      merchantName: product.merchant.name,
      status: product.status,
      sales: product.sales,
      unit: product.unit,
      isRecommended: product.isRecommended,
      sort: product.sort,
      remark: product.remark,
      specs,
      priceRange,
      createTime: product.createTime,
    },
  }
})
