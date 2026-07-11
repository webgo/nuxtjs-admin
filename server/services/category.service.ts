import prisma from '../utils/prisma'

export const categoryService = {
  async list(params: { page: number; pageSize: number; name?: string; status?: number }) {
    const { page, pageSize, name, status } = params
    const where: Record<string, unknown> = Object.create(null)
    if (name) where.name = { contains: name }
    if (status !== undefined) where.status = status

    const [rows, total] = await Promise.all([
      prisma.sysCategory.findMany({
        where, skip: (page - 1) * pageSize, take: pageSize,
        orderBy: [{ sort: 'asc' }],
        include: { _count: { select: { contents: true } } },
      }),
      prisma.sysCategory.count({ where }),
    ])
    const list = rows.map(c => ({
      id: c.id, name: c.name, code: c.code, description: c.description,
      sort: c.sort, status: c.status, remark: c.remark,
      createTime: c.createTime, updateTime: c.updateTime,
      contentCount: c._count.contents,
    }))
    return { list, total, page, pageSize }
  },

  async findAll() {
    return prisma.sysCategory.findMany({ orderBy: [{ sort: 'asc' }] })
  },

  async findById(id: number) {
    const category = await prisma.sysCategory.findUnique({ where: { id } })
    if (!category) throw createError({ statusCode: 404, message: '分类不存在' })
    return category
  },

  async create(params: { name: string; code: string; description?: string; sort?: number; status?: number; remark?: string }) {
    const existing = await prisma.sysCategory.findUnique({ where: { code: params.code } })
    if (existing) throw createError({ statusCode: 409, message: '分类编码已存在' })
    return prisma.sysCategory.create({
      data: { name: params.name, code: params.code, description: params.description || null, sort: params.sort ?? 0, status: params.status ?? 1, remark: params.remark || null },
    })
  },

  async update(id: number, params: { name?: string; code?: string; description?: string; sort?: number; status?: number; remark?: string }) {
    const category = await prisma.sysCategory.findUnique({ where: { id } })
    if (!category) throw createError({ statusCode: 404, message: '分类不存在' })
    if (params.code && params.code !== category.code) {
      const existing = await prisma.sysCategory.findUnique({ where: { code: params.code } })
      if (existing) throw createError({ statusCode: 409, message: '分类编码已存在' })
    }
    await prisma.sysCategory.update({ where: { id }, data: params })
    return this.findById(id)
  },

  async delete(id: number) {
    const category = await prisma.sysCategory.findUnique({ where: { id } })
    if (!category) throw createError({ statusCode: 404, message: '分类不存在' })
    const contentCount = await prisma.sysContent.count({ where: { categoryId: id } })
    if (contentCount > 0) throw createError({ statusCode: 400, message: '该分类下有内容，不能删除' })
    await prisma.sysCategory.delete({ where: { id } })
    return true
  },
}
