import db from '../utils/db'
import { sysLanguage, sysTranslation } from '../../db/schema'
import { eq, like, asc, and, not, count as drizzleCount } from 'drizzle-orm'

export const languageService = {
  async list(params: { page: number; pageSize: number; name?: string; status?: number }) {
    const { page, pageSize, name, status } = params
    const conditions: ReturnType<typeof eq>[] = []
    if (name) conditions.push(like(sysLanguage.name, `%${name}%`))
    if (status !== undefined) conditions.push(eq(sysLanguage.status, status))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [rows, countResult] = await Promise.all([
      db.select().from(sysLanguage)
        .where(where)
        .orderBy(asc(sysLanguage.sort))
        .offset((page - 1) * pageSize)
        .limit(pageSize),
      db.select({ count: drizzleCount() }).from(sysLanguage).where(where),
    ])
    return { list: rows, total: countResult[0]?.count ?? 0, page, pageSize }
  },

  async listAll() {
    return db.select().from(sysLanguage)
      .where(eq(sysLanguage.status, 1))
      .orderBy(asc(sysLanguage.sort))
  },

  async findById(id: number) {
    const [item] = await db.select().from(sysLanguage).where(eq(sysLanguage.id, id))
    if (!item) throw createError({ statusCode: 404, message: '语言不存在' })
    return item
  },

  async findByCode(code: string) {
    const [item] = await db.select().from(sysLanguage).where(eq(sysLanguage.code, code))
    return item || null
  },

  async create(params: { name: string; code: string; sort?: number; status?: number; remark?: string; isDefault?: boolean }) {
    const [existing] = await db.select().from(sysLanguage).where(eq(sysLanguage.code, params.code))
    if (existing) throw createError({ statusCode: 400, message: '语言编码已存在' })

    if (params.isDefault) {
      await db.update(sysLanguage).set({ isDefault: 0 }).where(eq(sysLanguage.isDefault, 1))
    }

    const now = new Date().toISOString().slice(0, 23).replace('T', ' ')
    const [result] = await db.insert(sysLanguage).values({
      name: params.name, code: params.code, sort: params.sort ?? 0,
      status: params.status ?? 1, remark: params.remark || null,
      isDefault: params.isDefault ? 1 : 0, updateTime: now,
    })
    return { id: Number(result.insertId), ...params }
  },

  async update(id: number, params: { name?: string; code?: string; sort?: number; status?: number; remark?: string; isDefault?: boolean }) {
    const item = await this.findById(id)

    if (params.code && params.code !== item.code) {
      const [existing] = await db.select().from(sysLanguage).where(eq(sysLanguage.code, params.code))
      if (existing) throw createError({ statusCode: 400, message: '语言编码已存在' })
    }

    if (params.isDefault) {
      await db.update(sysLanguage)
        .set({ isDefault: 0 })
        .where(and(eq(sysLanguage.isDefault, 1), not(eq(sysLanguage.id, id))))
    }

    const updateData: Record<string, unknown> = { ...params }
    if (params.isDefault !== undefined) updateData.isDefault = params.isDefault ? 1 : 0
    await db.update(sysLanguage).set(updateData).where(eq(sysLanguage.id, id))
    return this.findById(id)
  },

  async delete(id: number) {
    const item = await this.findById(id)
    await db.delete(sysTranslation).where(eq(sysTranslation.locale, item.code))
    await db.delete(sysLanguage).where(eq(sysLanguage.id, id))
    return true
  },

  async getDefault() {
    const [item] = await db.select().from(sysLanguage)
      .where(and(eq(sysLanguage.isDefault, 1), eq(sysLanguage.status, 1)))
    return item || null
  },
}
