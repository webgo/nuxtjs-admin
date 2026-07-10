import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 10
  const merchantId = query.merchantId !== undefined ? Number(query.merchantId) : undefined
  const categoryId = query.categoryId !== undefined ? Number(query.categoryId) : undefined
  const name = query.name as string | undefined
  const status = query.status !== undefined ? Number(query.status) : undefined
  const isRecommended = query.isRecommended !== undefined ? Number(query.isRecommended) : undefined

  const where: any = {}
  if (merchantId !== undefined) where.merchantId = merchantId
  if (categoryId !== undefined) where.categoryId = categoryId
  if (name) where.name = { contains: name }
  if (status !== undefined) where.status = status
  if (isRecommended !== undefined) where.isRecommended = isRecommended

  const [rows, total] = await Promise.all([
    prisma.sysProduct.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ sort: 'asc' }, { createTime: 'desc' }],
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
    }),
    prisma.sysProduct.count({ where }),
  ])

  const list = rows.map(p => {
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
    const sym = p.specs.find(s => s.unit?.symbol)?.unit?.symbol || ''
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
      merchantName: p.merchant.name,
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

  return { code: 200, data: { list, total, page, pageSize } }
})
