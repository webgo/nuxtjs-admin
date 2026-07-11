import prisma from '../utils/prisma'

export const priceUnitService = {
  async list(params: { page: number; pageSize: number; name?: string; status?: number }) {
    const { page, pageSize, name, status } = params
    const where: Record<string, unknown> = {}
    if (name) where.name = { contains: name }
    if (status !== undefined) where.status = status

    const [rows, total] = await Promise.all([
      prisma.sysPriceUnit.findMany({
        where, skip: (page - 1) * pageSize, take: pageSize,
        orderBy: [{ sort: 'asc' }],
      }),
      prisma.sysPriceUnit.count({ where }),
    ])
    return { list: rows, total, page, pageSize }
  },

  async findAll() {
    return prisma.sysPriceUnit.findMany({
      where: { status: 1 }, orderBy: [{ sort: 'asc' }],
    })
  },

  async findById(id: number) {
    const unit = await prisma.sysPriceUnit.findUnique({ where: { id } })
    if (!unit) throw createError({ statusCode: 404, message: '价格单位不存在' })
    return unit
  },

  async create(params: { name: string; symbol: string; sort?: number; status?: number; remark?: string }) {
    return prisma.sysPriceUnit.create({ data: params })
  },

  async update(id: number, params: { name?: string; symbol?: string; sort?: number; status?: number; remark?: string }) {
    const unit = await prisma.sysPriceUnit.findUnique({ where: { id } })
    if (!unit) throw createError({ statusCode: 404, message: '价格单位不存在' })
    await prisma.sysPriceUnit.update({ where: { id }, data: params })
    return this.findById(id)
  },

  async delete(id: number) {
    const unit = await prisma.sysPriceUnit.findUnique({ where: { id } })
    if (!unit) throw createError({ statusCode: 404, message: '价格单位不存在' })
    const specCount = await prisma.sysProductSpec.count({ where: { unitId: id } })
    if (specCount > 0) throw createError({ statusCode: 400, message: '该价格单位已被使用，不能删除' })
    await prisma.sysPriceUnit.delete({ where: { id } })
    return true
  },
}
