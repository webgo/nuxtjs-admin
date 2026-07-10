import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) {
    throw createError({ statusCode: 401, message: '未登录' })
  }
  const userId = auth.userId

  const body = await readBody(event)
  const { merchantId, productId, specName, quantity } = body

  if (!merchantId || !productId) {
    throw createError({ statusCode: 400, message: '商家和商品不能为空' })
  }

  const existing = await prisma.sysCart.findFirst({
    where: { userId, merchantId, productId, specName: specName || null },
  })

  if (existing) {
    await prisma.sysCart.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + (quantity || 1) },
    })
  } else {
    await prisma.sysCart.create({
      data: {
        userId, merchantId, productId,
        specName: specName || null,
        quantity: quantity || 1,
      },
    })
  }

  return { code: 200, msg: '添加成功' }
})
