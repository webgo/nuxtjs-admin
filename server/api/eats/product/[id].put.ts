import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const { name, code, description, image, categoryId, merchantId,
    status, unit, isRecommended, sort, remark, specs } = body

  const product = await prisma.sysProduct.findUnique({ where: { id } })
  if (!product) {
    throw createError({ statusCode: 404, message: '商品不存在' })
  }

  if (code && code !== product.code) {
    const exist = await prisma.sysProduct.findUnique({ where: { code } })
    if (exist) {
      throw createError({ statusCode: 409, message: '商品编码已存在' })
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.sysProduct.update({
      where: { id },
      data: {
        name, code, description, image, categoryId, merchantId,
        status, unit, isRecommended, sort, remark,
      },
    })

    if (specs && specs.length > 0) {
      await tx.sysProductSpec.deleteMany({ where: { productId: id } })

      for (let i = 0; i < specs.length; i++) {
        const spec = specs[i]
        await tx.sysProductSpec.create({
          data: {
            productId: id,
            name: spec.name,
            price: spec.price,
            originalPrice: spec.originalPrice,
            unitId: spec.unitId ?? null,
            isDefault: spec.isDefault ?? (i === 0 ? 1 : 0),
            stock: spec.stock ?? 0,
            sort: spec.sort ?? i,
            status: 1,
          },
        })
      }
    }
  })

  return { code: 200, msg: '更新成功' }
})
