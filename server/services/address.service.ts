import prisma from '../utils/prisma'

export const addressService = {
  async list(userId: number) {
    return prisma.sysUserAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }],
    })
  },

  async findById(id: number, userId: number) {
    const address = await prisma.sysUserAddress.findUnique({ where: { id } })
    if (!address) throw createError({ statusCode: 404, message: '地址不存在' })
    if (address.userId !== userId) throw createError({ statusCode: 403, message: '无权访问' })
    return address
  },

  async create(params: { userId: number; name: string; phone: string; detail: string; label?: string; province?: string; city?: string; district?: string; isDefault?: number }) {
    const { userId, name, phone, detail, label, province, city, district, isDefault } = params
    if (isDefault === 1) {
      await prisma.sysUserAddress.updateMany({
        where: { userId, isDefault: 1 },
        data: { isDefault: 0 },
      })
    }
    return prisma.sysUserAddress.create({
      data: { userId, label: label || null, name, phone, province: province || null, city: city || null, district: district || null, detail, isDefault: isDefault || 0 },
    })
  },

  async update(id: number, userId: number, params: { name?: string; phone?: string; detail?: string; label?: string; province?: string; city?: string; district?: string; isDefault?: number }) {
    const address = await prisma.sysUserAddress.findUnique({ where: { id } })
    if (!address) throw createError({ statusCode: 404, message: '地址不存在' })
    if (address.userId !== userId) throw createError({ statusCode: 403, message: '无权操作' })

    if (params.isDefault === 1) {
      await prisma.sysUserAddress.updateMany({
        where: { userId, isDefault: 1, id: { not: id } },
        data: { isDefault: 0 },
      })
    }
    await prisma.sysUserAddress.update({ where: { id }, data: params })
    return prisma.sysUserAddress.findUnique({ where: { id } })
  },

  async delete(id: number, userId: number) {
    const address = await prisma.sysUserAddress.findUnique({ where: { id } })
    if (!address) throw createError({ statusCode: 404, message: '地址不存在' })
    if (address.userId !== userId) throw createError({ statusCode: 403, message: '无权操作' })
    await prisma.sysUserAddress.delete({ where: { id } })
    return true
  },

  async setDefault(id: number, userId: number) {
    const address = await prisma.sysUserAddress.findUnique({ where: { id } })
    if (!address) throw createError({ statusCode: 404, message: '地址不存在' })
    if (address.userId !== userId) throw createError({ statusCode: 403, message: '无权操作' })

    await prisma.sysUserAddress.updateMany({ where: { userId }, data: { isDefault: 0 } })
    await prisma.sysUserAddress.update({ where: { id }, data: { isDefault: 1 } })
    return prisma.sysUserAddress.findUnique({ where: { id } })
  },
}
