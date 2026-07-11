import prisma from '../utils/prisma'

export const contentService = {
  async list(params: { page: number; pageSize: number; title?: string; categoryId?: number; isRecommended?: number; status?: number }) {
    const { page, pageSize, title, categoryId, isRecommended, status } = params
    const where: Record<string, unknown> = {}
    if (title) where.title = { contains: title }
    if (categoryId !== undefined) where.categoryId = categoryId
    if (isRecommended !== undefined) where.isRecommended = isRecommended
    if (status !== undefined) where.status = status

    const [rows, total] = await Promise.all([
      prisma.sysContent.findMany({
        where, skip: (page - 1) * pageSize, take: pageSize,
        orderBy: [{ createTime: 'desc' }],
        include: { category: { select: { id: true, name: true } } },
      }),
      prisma.sysContent.count({ where }),
    ])
    return { list: rows, total, page, pageSize }
  },

  async findById(id: number) {
    const content = await prisma.sysContent.findUnique({
      where: { id },
      include: { category: { select: { id: true, name: true } } },
    })
    if (!content) throw createError({ statusCode: 404, message: '内容不存在' })
    return content
  },

  async create(params: { title: string; thumbnail?: string; summary?: string; content?: string; categoryId?: number; isRecommended?: number; status?: number; remark?: string }) {
    if (!params.title) throw createError({ statusCode: 400, message: '内容标题不能为空' })
    return prisma.sysContent.create({
      data: {
        title: params.title, thumbnail: params.thumbnail || null, summary: params.summary || null,
        content: params.content || null, categoryId: params.categoryId || null,
        isRecommended: params.isRecommended ?? 0, status: params.status ?? 1, remark: params.remark || null,
      },
    })
  },

  async update(id: number, params: { title?: string; thumbnail?: string; summary?: string; content?: string; categoryId?: number; isRecommended?: number; status?: number; remark?: string }) {
    const content = await prisma.sysContent.findUnique({ where: { id } })
    if (!content) throw createError({ statusCode: 404, message: '内容不存在' })
    await prisma.sysContent.update({ where: { id }, data: params })
    return this.findById(id)
  },

  async delete(id: number) {
    const content = await prisma.sysContent.findUnique({ where: { id } })
    if (!content) throw createError({ statusCode: 404, message: '内容不存在' })
    await prisma.sysContent.delete({ where: { id } })
    return true
  },

  async incrementClickCount(id: number) {
    await prisma.sysContent.update({ where: { id }, data: { clickCount: { increment: 1 } } })
  },
}
