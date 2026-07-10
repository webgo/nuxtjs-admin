import prisma from '../../../utils/prisma'

function generateOrderNo(): string {
  const now = new Date()
  const ts = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0')
  const random = Math.floor(1000 + Math.random() * 9000)
  return `DD${ts}${random}`
}

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) {
    throw createError({ statusCode: 401, message: '未登录' })
  }

  const body = await readBody(event)
  const { merchantId, deliveryType, deliveryAddress, contactName, contactPhone,
    remark, items } = body

  if (!merchantId || !items || items.length === 0) {
    throw createError({ statusCode: 400, message: '商家和商品不能为空' })
  }

  const merchant = await prisma.sysMerchant.findUnique({ where: { id: merchantId } })
  if (!merchant) {
    throw createError({ statusCode: 404, message: '商家不存在' })
  }

  const orderNo = generateOrderNo()

  const result = await prisma.$transaction(async (tx) => {
    let totalAmount = 0
    const orderItems: any[] = []

    for (const item of items) {
      const product = await tx.sysProduct.findUnique({
        where: { id: item.productId },
        select: { id: true, name: true, image: true },
      })
      if (!product) {
        throw createError({ statusCode: 404, message: `商品 ${item.productId} 不存在` })
      }

      let price = 0
      if (item.specName) {
        const spec = await tx.sysProductSpec.findFirst({
          where: { productId: item.productId, name: item.specName, status: 1 },
        })
        if (!spec) {
          throw createError({ statusCode: 400, message: `规格 ${item.specName} 不存在` })
        }
        price = Number(spec.price)
      } else {
        const defaultSpec = await tx.sysProductSpec.findFirst({
          where: { productId: item.productId, isDefault: 1, status: 1 },
        })
        if (defaultSpec) {
          price = Number(defaultSpec.price)
        }
      }

      const quantity = item.quantity || 1
      const subtotal = price * quantity
      totalAmount += subtotal

      orderItems.push({
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        specName: item.specName || null,
        price,
        quantity,
        subtotal,
      })
    }

    const order = await tx.sysOrder.create({
      data: {
        orderNo,
        merchantId,
        userId: auth.id,
        totalAmount,
        deliveryFee: merchant.deliveryFee ? Number(merchant.deliveryFee) : 0,
        deliveryType: deliveryType || null,
        status: 'pending',
        deliveryAddress: deliveryAddress || null,
        contactName: contactName || null,
        contactPhone: contactPhone || null,
        remark: remark || null,
        items: {
          create: orderItems,
        },
      },
    })

    return order
  })

  return { code: 200, msg: '下单成功', data: { id: result.id, orderNo: result.orderNo } }
})
