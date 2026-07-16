import db from '../utils/db'
import { sysProductCategory, sysMerchant, sysProduct } from '../../db/schema'
import { eq, like, asc, and, count as drizzleCount } from 'drizzle-orm'

export const productCategoryService = {
  async list(params: { page: number; pageSize: number; merchantId?: number; name?: string }) {
    const { page, pageSize, merchantId, name } = params
    const conditions: ReturnType<typeof eq>[] = []
    if (merchantId !== undefined) conditions.push(eq(sysProductCategory.merchantId, merchantId))
    if (name) conditions.push(like(sysProductCategory.name, `%${name}%`))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [rows, countResult] = await Promise.all([
      db.select({
        id: sysProductCategory.id, name: sysProductCategory.name,
        merchantId: sysProductCategory.merchantId, sort: sysProductCategory.sort,
        status: sysProductCategory.status, remark: sysProductCategory.remark,
        createTime: sysProductCategory.createTime, updateTime: sysProductCategory.updateTime,
        merchant: {
          id: sysMerchant.id, name: sysMerchant.name,
        },
      }).from(sysProductCategory)
        .leftJoin(sysMerchant, eq(sysProductCategory.merchantId, sysMerchant.id))
        .where(where)
        .orderBy(asc(sysProductCategory.sort))
        .offset((page - 1) * pageSize)
        .limit(pageSize),
      db.select({ count: drizzleCount() }).from(sysProductCategory).where(where),
    ])
    return { list: rows, total: countResult[0]?.count ?? 0, page, pageSize }
  },

  async findById(id: number) {
    const [item] = await db.select({
      id: sysProductCategory.id, name: sysProductCategory.name,
      merchantId: sysProductCategory.merchantId, sort: sysProductCategory.sort,
      status: sysProductCategory.status, remark: sysProductCategory.remark,
      createTime: sysProductCategory.createTime, updateTime: sysProductCategory.updateTime,
      merchant: {
        id: sysMerchant.id, name: sysMerchant.name,
      },
    }).from(sysProductCategory)
      .leftJoin(sysMerchant, eq(sysProductCategory.merchantId, sysMerchant.id))
      .where(eq(sysProductCategory.id, id))
    if (!item) throw createError({ statusCode: 404, message: '商品分类不存在' })
    return item
  },

  async create(params: { name: string; merchantId: number; sort?: number; status?: number; remark?: string }) {
    const now = new Date().toISOString().slice(0, 23).replace('T', ' ')
    const [result] = await db.insert(sysProductCategory).values({ ...params, updateTime: now })
    return { id: Number(result.insertId), ...params }
  },

  async update(id: number, params: { name?: string; sort?: number; status?: number; remark?: string }) {
    const item = await this.findById(id)
    await db.update(sysProductCategory).set(params).where(eq(sysProductCategory.id, id))
    return this.findById(id)
  },

  async delete(id: number) {
    const item = await this.findById(id)
    const [countResult] = await db.select({ count: drizzleCount() }).from(sysProduct).where(eq(sysProduct.categoryId, id))
    const count = countResult?.count ?? 0
    if (count > 0) throw createError({ statusCode: 400, message: '该分类下有商品，不能删除' })
    await db.delete(sysProductCategory).where(eq(sysProductCategory.id, id))
    return true
  },
}
