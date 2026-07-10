import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, code, description, image, categoryId, merchantId,
    status, unit, isRecommended, sort, remark, specs } = body

  if (!name || !code || !merchantId) {
    throw createError({ statusCode: 400, message: '名称、编码和商家不能为空' })
  }

  const exist = await prisma.sysProduct.findUnique({ where: { code } })
  if (exist) {
    throw createError({ statusCode: 409, message: '商品编码已存在' })
  }

  const merchant = await prisma.sysMerchant.findUnique({ where: { id: merchantId } })
  if (!merchant) {
    throw createError({ statusCode: 404, message: '商家不存在' })
  }

  if (!specs || specs.length === 0) {
    throw createError({ statusCode: 400, message: '至少需要一个规格' })
  }

  const result = await prisma.$transaction(async (tx) => {
    const product = await tx.sysProduct.create({
      data: {
        name, code, description, image, categoryId, merchantId,
        status: status ?? 1, unit, isRecommended: isRecommended ?? 0,
        sort: sort ?? 0, remark,
      },
    })

    for (let i = 0; i < specs.length; i++) {
      const spec = specs[i]
      await tx.sysProductSpec.create({
        data: {
          productId: product.id,
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

    return product
  })

  return { code: 200, msg: '创建成功', data: { id: result.id } }
})
