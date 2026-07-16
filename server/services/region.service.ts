import db from '../utils/db'
import { sysRegion, sysMerchant } from '../../db/schema'
import { eq, like, asc, and, count as drizzleCount } from 'drizzle-orm'

export const regionService = {
  async tree() {
    const regions = await db.select().from(sysRegion).orderBy(asc(sysRegion.sort))
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
    const conditions: ReturnType<typeof eq>[] = []
    if (name) conditions.push(like(sysRegion.name, `%${name}%`))
    if (level !== undefined) conditions.push(eq(sysRegion.level, level))
    if (status !== undefined) conditions.push(eq(sysRegion.status, status))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [rows, countResult] = await Promise.all([
      db.select().from(sysRegion)
        .where(where)
        .orderBy(asc(sysRegion.sort))
        .offset((page - 1) * pageSize)
        .limit(pageSize),
      db.select({ count: drizzleCount() }).from(sysRegion).where(where),
    ])
    return { list: rows, total: countResult[0]?.count ?? 0, page, pageSize }
  },

  async findById(id: number) {
    const [region] = await db.select().from(sysRegion).where(eq(sysRegion.id, id))
    if (!region) throw createError({ statusCode: 404, message: '地区不存在' })
    return region
  },

  async create(params: { name: string; nameTw?: string; nameEn?: string; nameJp?: string; parentId?: number | null; level: number; lang?: string; lng?: number; lat?: number; sort?: number; status?: number }) {
    const now = new Date().toISOString().slice(0, 23).replace('T', ' ')
    const [result] = await db.insert(sysRegion).values({
      name: params.name, nameTw: params.nameTw || null, nameEn: params.nameEn || null, nameJp: params.nameJp || null,
      parentId: params.parentId || null, level: params.level,
      lang: params.lang || 'tw', lng: params.lng || null, lat: params.lat || null,
      sort: params.sort ?? 0, status: params.status ?? 1,
      updateTime: now,
    })
    return { id: Number(result.insertId), ...params }
  },

  async update(id: number, params: { name?: string; nameTw?: string; nameEn?: string; nameJp?: string; parentId?: number | null; level?: number; lang?: string; lng?: number; lat?: number; sort?: number; status?: number }) {
    const region = await this.findById(id)
    await db.update(sysRegion).set(params).where(eq(sysRegion.id, id))
    return this.findById(id)
  },

  async delete(id: number) {
    const region = await this.findById(id)
    const [childCountResult] = await db.select({ count: drizzleCount() }).from(sysRegion).where(eq(sysRegion.parentId, id))
    const childCount = childCountResult?.count ?? 0
    if (childCount > 0) throw createError({ statusCode: 400, message: '该地区下有子地区，不能删除' })
    const [merchantCountResult] = await db.select({ count: drizzleCount() }).from(sysMerchant).where(eq(sysMerchant.regionId, id))
    const merchantCount = merchantCountResult?.count ?? 0
    if (merchantCount > 0) throw createError({ statusCode: 400, message: '该地区下有商家，不能删除' })
    await db.delete(sysRegion).where(eq(sysRegion.id, id))
    return true
  },
}

interface RegionNode {
  id: number; name: string; nameTw: string | null; nameEn: string | null; nameJp: string | null
  parentId: number | null; level: number; lang: string; lng: number | null; lat: number | null
  sort: number; status: number; remark: string | null; children: RegionNode[]
}
