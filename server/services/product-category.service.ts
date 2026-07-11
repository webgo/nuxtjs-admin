import prisma from '../utils/prisma'

export const productCategoryService = {
  async list(params: { page: number; pageSize: number; merchantId?: number; name?: string }) {
    const { page, pageSize, merchantId, name } = params
    const where: Record<string, unknown> = {}
    if (merchantId !== undefined) where.merchantId = merchantId
    if (name) where.name = { contains: name }

    const [rows, total] = await Promise.all([
      prisma.sysProductCategory.findMany({
        where, skip: (page - 1) * pageSize, take: pageSize,
        orderBy: [{ sort: 'asc' }],
        include: { merchant: { select: { id: true, name: true } } },
      }),
      prisma.sysProductCategory.count({ where }),
    ])
    return { list: rows, total, page, pageSize }
  },

  async findById(id: number) {
    const item = await prisma.sysProductCategory.findUnique({
      where: { id },
      include: { merchant: { select: { id: true, name: true } } },
    })
    if (!item) throw createError({ statusCode: 404, message: '商品分类不存在' })
    return item
  },

  async create(params: { name: string; merchantId: number; sort?: number; status?: number; remark?: string }) {
    return prisma.sysProductCategory.create({ data: params })
  },

  async update(id: number, params: { name?: string; sort?: number; status?: number; remark?: string }) {
    const item = await prisma.sysProductCategory.findUnique({ where: { id } })
    if (!item) throw createError({ statusCode: 404, message: '商品分类不存在' })
    return prisma.sysProductCategory.update({ where: { id }, data: params })
  },

  async delete(id: number) {
    const item = await prisma.sysProductCategory.findUnique({ where: { id } })
    if (!item) throw createError({ statusCode: 404, message: '商品分类不存在' })
    const count = await prisma.sysProduct.count({ where: { categoryId: id } })
    if (count > 0) throw createError({ statusCode: 400, message: '该分类下有商品，不能删除' })
    await prisma.sysProductCategory.delete({ where: { id } })
    return true
  },
}
