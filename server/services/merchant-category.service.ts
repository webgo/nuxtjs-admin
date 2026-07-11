import prisma from '../utils/prisma'

export const merchantCategoryService = {
  async list(params: { page: number; pageSize: number }) {
    const { page, pageSize } = params
    const [rows, total] = await Promise.all([
      prisma.sysMerchantCategory.findMany({
        skip: (page - 1) * pageSize, take: pageSize, orderBy: [{ sort: 'asc' }],
      }),
      prisma.sysMerchantCategory.count(),
    ])
    return { list: rows, total, page, pageSize }
  },

  async findAll() {
    return prisma.sysMerchantCategory.findMany({ orderBy: [{ sort: 'asc' }] })
  },

  async findById(id: number) {
    const item = await prisma.sysMerchantCategory.findUnique({ where: { id } })
    if (!item) throw createError({ statusCode: 404, message: '商家分类不存在' })
    return item
  },

  async create(params: { name: string; code: string; icon?: string; sort?: number; status?: number; remark?: string }) {
    return prisma.sysMerchantCategory.create({ data: params })
  },

  async update(id: number, params: { name?: string; code?: string; icon?: string; sort?: number; status?: number; remark?: string }) {
    const item = await prisma.sysMerchantCategory.findUnique({ where: { id } })
    if (!item) throw createError({ statusCode: 404, message: '商家分类不存在' })
    return prisma.sysMerchantCategory.update({ where: { id }, data: params })
  },

  async delete(id: number) {
    const item = await prisma.sysMerchantCategory.findUnique({ where: { id } })
    if (!item) throw createError({ statusCode: 404, message: '商家分类不存在' })
    const count = await prisma.sysMerchant.count({ where: { categoryId: id } })
    if (count > 0) throw createError({ statusCode: 400, message: '该分类下有商家，不能删除' })
    await prisma.sysMerchantCategory.delete({ where: { id } })
    return true
  },
}
