import prisma from '../utils/prisma'

export const regionService = {
  async tree() {
    const regions = await prisma.sysRegion.findMany({ orderBy: [{ sort: 'asc' }] })
    const map = new Map<number, RegionNode>()
    const roots: RegionNode[] = []

    for (const r of regions) {
      map.set(r.id, { ...r, children: [] })
    }
    for (const r of regions) {
      const node = map.get(r.id)!
      if (r.parentId && map.has(r.parentId)) {
        map.get(r.parentId)!.children.push(node)
      } else {
        roots.push(node)
      }
    }
    return roots
  },

  async list(params: { page: number; pageSize: number; name?: string; level?: number; status?: number }) {
    const { page, pageSize, name, level, status } = params
    const where: Record<string, unknown> = Object.create(null)
    if (name) where.name = { contains: name }
    if (level !== undefined) where.level = level
    if (status !== undefined) where.status = status

    const [rows, total] = await Promise.all([
      prisma.sysRegion.findMany({
        where, skip: (page - 1) * pageSize, take: pageSize,
        orderBy: [{ sort: 'asc' }],
      }),
      prisma.sysRegion.count({ where }),
    ])
    return { list: rows, total, page, pageSize }
  },

  async findById(id: number) {
    const region = await prisma.sysRegion.findUnique({ where: { id } })
    if (!region) throw createError({ statusCode: 404, message: '地区不存在' })
    return region
  },

  async create(params: { name: string; nameTw?: string; nameEn?: string; nameJp?: string; parentId?: number | null; level: number; lang?: string; lng?: number; lat?: number; sort?: number; status?: number }) {
    return prisma.sysRegion.create({
      data: {
        name: params.name, nameTw: params.nameTw || null, nameEn: params.nameEn || null, nameJp: params.nameJp || null,
        parentId: params.parentId || null, level: params.level,
        lang: params.lang || 'tw', lng: params.lng || null, lat: params.lat || null,
        sort: params.sort ?? 0, status: params.status ?? 1,
      },
    })
  },

  async update(id: number, params: { name?: string; nameTw?: string; nameEn?: string; nameJp?: string; parentId?: number | null; level?: number; lang?: string; lng?: number; lat?: number; sort?: number; status?: number }) {
    const region = await prisma.sysRegion.findUnique({ where: { id } })
    if (!region) throw createError({ statusCode: 404, message: '地区不存在' })
    await prisma.sysRegion.update({ where: { id }, data: params })
    return this.findById(id)
  },

  async delete(id: number) {
    const region = await prisma.sysRegion.findUnique({ where: { id } })
    if (!region) throw createError({ statusCode: 404, message: '地区不存在' })
    const childCount = await prisma.sysRegion.count({ where: { parentId: id } })
    if (childCount > 0) throw createError({ statusCode: 400, message: '该地区下有子地区，不能删除' })
    const merchantCount = await prisma.sysMerchant.count({ where: { regionId: id } })
    if (merchantCount > 0) throw createError({ statusCode: 400, message: '该地区下有商家，不能删除' })
    await prisma.sysRegion.delete({ where: { id } })
    return true
  },
}

interface RegionNode {
  id: number; name: string; nameTw: string | null; nameEn: string | null; nameJp: string | null
  parentId: number | null; level: number; lang: string; lng: number | null; lat: number | null
  sort: number; status: number; remark: string | null; children: RegionNode[]
}
