import db from '../utils/db'
import { sysPriceUnit, sysProductSpec } from '../../db/schema'
import { eq, like, asc, and, count, sql } from 'drizzle-orm'

export const priceUnitService = {
  async list(params: { page: number; pageSize: number; name?: string; status?: number }) {
    const { page, pageSize, name, status } = params
    const conditions: ReturnType<typeof eq>[] = []
    if (name) conditions.push(like(sysPriceUnit.name, `%${name}%`))
    if (status !== undefined) conditions.push(eq(sysPriceUnit.status, status))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [rows, countResult] = await Promise.all([
      db.select().from(sysPriceUnit)
        .where(where)
        .orderBy(asc(sysPriceUnit.sort))
        .offset((page - 1) * pageSize)
        .limit(pageSize),
      db.select({ count: count() }).from(sysPriceUnit).where(where),
    ])
    return { list: rows, total: countResult[0]?.count ?? 0, page, pageSize }
  },

  async findAll() {
    return db.select().from(sysPriceUnit)
      .where(eq(sysPriceUnit.status, 1))
      .orderBy(asc(sysPriceUnit.sort))
  },

  async findById(id: number) {
    const [unit] = await db.select().from(sysPriceUnit).where(eq(sysPriceUnit.id, id))
    if (!unit) throw createError({ statusCode: 404, message: '价格单位不存在' })
    return unit
  },

  async create(params: { name: string; symbol: string; sort?: number; status?: number; remark?: string }) {
    const now = new Date().toISOString().slice(0, 23).replace('T', ' ')
    const [result] = await db.insert(sysPriceUnit).values({ ...params, updateTime: now })
    return { id: Number(result.insertId), ...params }
  },

  async update(id: number, params: { name?: string; symbol?: string; sort?: number; status?: number; remark?: string }) {
    const unit = await this.findById(id)
    await db.update(sysPriceUnit).set(params).where(eq(sysPriceUnit.id, id))
    return this.findById(id)
  },

  async delete(id: number) {
    const unit = await this.findById(id)
    const [specCountResult] = await db.select({ count: count() }).from(sysProductSpec).where(eq(sysProductSpec.unitId, id))
    const specCount = specCountResult?.count ?? 0
    if (specCount > 0) throw createError({ statusCode: 400, message: '该价格单位已被使用，不能删除' })
    await db.delete(sysPriceUnit).where(eq(sysPriceUnit.id, id))
    return true
  },
}
