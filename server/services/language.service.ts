import prisma from '../utils/prisma'

export const languageService = {
  async list(params: { page: number; pageSize: number; name?: string; status?: number }) {
    const { page, pageSize, name, status } = params
    const where: Record<string, unknown> = {}
    if (name) where.name = { contains: name }
    if (status !== undefined) where.status = status

    const [rows, total] = await Promise.all([
      prisma.sysLanguage.findMany({
        where, skip: (page - 1) * pageSize, take: pageSize,
        orderBy: [{ sort: 'asc' }],
      }),
      prisma.sysLanguage.count({ where }),
    ])
    return { list: rows, total, page, pageSize }
  },

  async listAll() {
    return prisma.sysLanguage.findMany({
      where: { status: 1 },
      orderBy: [{ sort: 'asc' }],
    })
  },

  async findById(id: number) {
    const item = await prisma.sysLanguage.findUnique({ where: { id } })
    if (!item) throw createError({ statusCode: 404, message: '语言不存在' })
    return item
  },

  async findByCode(code: string) {
    return prisma.sysLanguage.findUnique({ where: { code } })
  },

  async create(params: { name: string; code: string; sort?: number; status?: number; remark?: string; isDefault?: boolean }) {
    const existing = await prisma.sysLanguage.findUnique({ where: { code: params.code } })
    if (existing) throw createError({ statusCode: 400, message: '语言编码已存在' })

    if (params.isDefault) {
      await prisma.sysLanguage.updateMany({ where: { isDefault: true }, data: { isDefault: false } })
    }

    return prisma.sysLanguage.create({ data: params })
  },

  async update(id: number, params: { name?: string; code?: string; sort?: number; status?: number; remark?: string; isDefault?: boolean }) {
    const item = await prisma.sysLanguage.findUnique({ where: { id } })
    if (!item) throw createError({ statusCode: 404, message: '语言不存在' })

    if (params.code && params.code !== item.code) {
      const existing = await prisma.sysLanguage.findUnique({ where: { code: params.code } })
      if (existing) throw createError({ statusCode: 400, message: '语言编码已存在' })
    }

    if (params.isDefault) {
      await prisma.sysLanguage.updateMany({ where: { isDefault: true, id: { not: id } }, data: { isDefault: false } })
    }

    await prisma.sysLanguage.update({ where: { id }, data: params })
    return this.findById(id)
  },

  async delete(id: number) {
    const item = await prisma.sysLanguage.findUnique({ where: { id } })
    if (!item) throw createError({ statusCode: 404, message: '语言不存在' })
    await prisma.sysTranslation.deleteMany({ where: { locale: item.code } })
    await prisma.sysLanguage.delete({ where: { id } })
    return true
  },

  async getDefault() {
    return prisma.sysLanguage.findFirst({ where: { isDefault: true, status: 1 } })
  },
}
