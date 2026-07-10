import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) {
    throw createError({ statusCode: 401, message: '未登录' })
  }
  const userId = auth.userId

  const cartItems = await prisma.sysCart.findMany({
    where: { userId },
    include: {
      merchant: { select: { name: true } },
      product: { select: { name: true, image: true } },
    },
    orderBy: { createTime: 'desc' },
  })

  const enriched = await Promise.all(cartItems.map(async (item) => {
    let price: number | undefined
    let unitName: string | undefined
    let unitSymbol: string | undefined
    if (item.specName) {
      const spec = await prisma.sysProductSpec.findFirst({
        where: { productId: item.productId, name: item.specName, status: 1 },
        select: { price: true, unitId: true },
      })
      if (spec) {
        price = Number(spec.price)
        if (spec.unitId) {
          const unit = await prisma.sysPriceUnit.findUnique({ where: { id: spec.unitId } })
          if (unit) { unitName = unit.name; unitSymbol = unit.symbol }
        }
      }
    } else {
      const defaultSpec = await prisma.sysProductSpec.findFirst({
        where: { productId: item.productId, isDefault: 1, status: 1 },
        select: { price: true, unitId: true },
      })
      if (defaultSpec) {
        price = Number(defaultSpec.price)
        if (defaultSpec.unitId) {
          const unit = await prisma.sysPriceUnit.findUnique({ where: { id: defaultSpec.unitId } })
          if (unit) { unitName = unit.name; unitSymbol = unit.symbol }
        }
      }
    }

    return {
      id: item.id,
      userId: item.userId,
      merchantId: item.merchantId,
      merchantName: item.merchant.name,
      productId: item.productId,
      productName: item.product.name,
      productImage: item.product.image,
      specName: item.specName,
      price,
      unitName,
      unitSymbol,
      quantity: item.quantity,
      createTime: item.createTime,
    }
  }))

  // Group by merchant
  const grouped: Record<number, any> = {}
  for (const item of enriched) {
    if (!grouped[item.merchantId]) {
      grouped[item.merchantId] = {
        merchantId: item.merchantId,
        merchantName: item.merchantName,
        items: [],
      }
    }
    grouped[item.merchantId].items.push(item)
  }

  return { code: 200, data: Object.values(grouped) }
})
