import prisma from '../utils/prisma'

export const productService = {
  async list(params: { page: number; pageSize: number; merchantId?: number; categoryId?: number; name?: string; status?: number }) {
    const { page, pageSize, merchantId, categoryId, name, status } = params
    const where: Record<string, unknown> = {}
    if (merchantId !== undefined) where.merchantId = merchantId
    if (categoryId !== undefined) where.categoryId = categoryId
    if (name) where.name = { contains: name }
    if (status !== undefined) where.status = status

    const [rows, total] = await Promise.all([
      prisma.sysProduct.findMany({
        where, skip: (page - 1) * pageSize, take: pageSize,
        orderBy: [{ sort: 'asc' }],
        include: {
          merchant: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
          specs: { where: { status: 1 }, orderBy: [{ isDefault: 'desc' }] },
        },
      }),
      prisma.sysProduct.count({ where }),
    ])

    const list = rows.map(p => ({
      id: p.id, merchantId: p.merchantId, merchantName: p.merchant?.name,
      categoryId: p.categoryId, categoryName: p.category?.name,
      name: p.name, code: p.code, description: p.description, image: p.image,
      status: p.status, sort: p.sort, sales: p.sales, unit: p.unit, isRecommended: p.isRecommended,
      specs: p.specs.map(s => ({ id: s.id, name: s.name, price: Number(s.price), originalPrice: s.originalPrice ? Number(s.originalPrice) : undefined, isDefault: s.isDefault })),
      createTime: p.createTime, updateTime: p.updateTime,
    }))
    return { list, total, page, pageSize }
  },

  async listPublic(params: { page: number; pageSize: number; merchantId: number; categoryId?: number }) {
    const { page, pageSize, merchantId, categoryId } = params
    const where: Record<string, unknown> = { merchantId, status: 1 }
    if (categoryId !== undefined) where.categoryId = categoryId

    const rows = await prisma.sysProduct.findMany({
      where, orderBy: [{ sort: 'asc' }],
      include: {
        category: { select: { id: true, name: true } },
        specs: { where: { status: 1 }, orderBy: [{ isDefault: 'desc' }] },
      },
    })
    const list = rows.map(p => ({
      id: p.id, name: p.name, description: p.description, image: p.image,
      categoryName: p.category?.name, sales: p.sales, unit: p.unit,
      specs: p.specs.map(s => ({ id: s.id, name: s.name, price: Number(s.price), originalPrice: s.originalPrice ? Number(s.originalPrice) : undefined, isDefault: s.isDefault })),
    }))
    return { list, total: rows.length, page, pageSize }
  },

  async findById(id: number) {
    const product = await prisma.sysProduct.findUnique({
      where: { id },
      include: {
        merchant: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        specs: { orderBy: [{ isDefault: 'desc' }] },
      },
    })
    if (!product) throw createError({ statusCode: 404, message: '商品不存在' })
    return product
  },

  async create(params: { merchantId: number; name: string; code: string; categoryId?: number; description?: string; image?: string; unit?: string; sort?: number; status?: number; isRecommended?: number; specs?: Array<{ name: string; price: number; originalPrice?: number; unitId?: number; isDefault?: number; stock?: number }> }) {
    const { specs, ...productData } = params

    return prisma.sysProduct.create({
      data: {
        ...productData,
        description: productData.description || null, image: productData.image || null,
        unit: productData.unit || null, sort: productData.sort ?? 0,
        status: productData.status ?? 1, isRecommended: productData.isRecommended ?? 0,
        specs: specs?.length ? { create: specs.map(s => ({ name: s.name, price: s.price, originalPrice: s.originalPrice || null, unitId: s.unitId || null, isDefault: s.isDefault ?? 0, stock: s.stock ?? 0, status: 1 })) } : undefined,
      },
      include: { specs: true },
    })
  },

  async update(id: number, params: { name?: string; code?: string; categoryId?: number; description?: string; image?: string; unit?: string; sort?: number; status?: number; isRecommended?: number }) {
    const product = await prisma.sysProduct.findUnique({ where: { id } })
    if (!product) throw createError({ statusCode: 404, message: '商品不存在' })
    await prisma.sysProduct.update({ where: { id }, data: params })
    return this.findById(id)
  },

  async delete(id: number) {
    const product = await prisma.sysProduct.findUnique({ where: { id } })
    if (!product) throw createError({ statusCode: 404, message: '商品不存在' })
    await prisma.sysProductSpec.deleteMany({ where: { productId: id } })
    await prisma.sysProduct.delete({ where: { id } })
    return true
  },

  async addSpec(productId: number, data: { name: string; price: number; originalPrice?: number; unitId?: number; isDefault?: number; stock?: number }) {
    const product = await prisma.sysProduct.findUnique({ where: { id: productId } })
    if (!product) throw createError({ statusCode: 404, message: '商品不存在' })
    if (data.isDefault === 1) {
      await prisma.sysProductSpec.updateMany({ where: { productId, isDefault: 1 }, data: { isDefault: 0 } })
    }
    return prisma.sysProductSpec.create({
      data: { productId, name: data.name, price: data.price, originalPrice: data.originalPrice || null, unitId: data.unitId || null, isDefault: data.isDefault ?? 0, stock: data.stock ?? 0, status: 1 },
    })
  },

  async updateSpec(id: number, data: { name?: string; price?: number; originalPrice?: number; unitId?: number; isDefault?: number; stock?: number; status?: number }) {
    const spec = await prisma.sysProductSpec.findUnique({ where: { id } })
    if (!spec) throw createError({ statusCode: 404, message: '规格不存在' })
    if (data.isDefault === 1) {
      await prisma.sysProductSpec.updateMany({ where: { productId: spec.productId, isDefault: 1, id: { not: id } }, data: { isDefault: 0 } })
    }
    await prisma.sysProductSpec.update({ where: { id }, data })
    return prisma.sysProductSpec.findUnique({ where: { id } })
  },

  async deleteSpec(id: number) {
    const spec = await prisma.sysProductSpec.findUnique({ where: { id } })
    if (!spec) throw createError({ statusCode: 404, message: '规格不存在' })
    await prisma.sysProductSpec.delete({ where: { id } })
    return true
  },
}
