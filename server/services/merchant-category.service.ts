import db from '../utils/db'
import { sysMerchantCategory, sysMerchant } from '../../db/schema'
import { eq, asc, count as drizzleCount } from 'drizzle-orm'

export const merchantCategoryService = {
  async list(params: { page: number; pageSize: number }) {
    const { page, pageSize } = params
    const [rows, countResult] = await Promise.all([
      db.select().from(sysMerchantCategory)
        .orderBy(asc(sysMerchantCategory.sort))
        .offset((page - 1) * pageSize)
        .limit(pageSize),
      db.select({ count: drizzleCount() }).from(sysMerchantCategory),
    ])
    return { list: rows, total: countResult[0]?.count ?? 0, page, pageSize }
  },

  async findAll() {
    return db.select().from(sysMerchantCategory).orderBy(asc(sysMerchantCategory.sort))
  },

  async findById(id: number) {
    const [item] = await db.select().from(sysMerchantCategory).where(eq(sysMerchantCategory.id, id))
    if (!item) throw createError({ statusCode: 404, message: '商家分类不存在' })
    return item
  },

  async create(params: { name: string; code: string; icon?: string; sort?: number; status?: number; remark?: string }) {
    const now = new Date().toISOString().slice(0, 23).replace('T', ' ')
    const [result] = await db.insert(sysMerchantCategory).values({ ...params, updateTime: now })
    return { id: Number(result.insertId), ...params }
  },

  async update(id: number, params: { name?: string; code?: string; icon?: string; sort?: number; status?: number; remark?: string }) {
    const item = await this.findById(id)
    const [result] = await db.update(sysMerchantCategory).set(params).where(eq(sysMerchantCategory.id, id))
    return this.findById(id)
  },

  async delete(id: number) {
    const item = await this.findById(id)
    const [countResult] = await db.select({ count: drizzleCount() }).from(sysMerchant).where(eq(sysMerchant.categoryId, id))
    const count = countResult?.count ?? 0
    if (count > 0) throw createError({ statusCode: 400, message: '该分类下有商家，不能删除' })
    await db.delete(sysMerchantCategory).where(eq(sysMerchantCategory.id, id))
    return true
  },
}
