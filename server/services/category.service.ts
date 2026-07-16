import db from '../utils/db'
import { sysCategory, sysContent } from '../../db/schema'
import { eq, like, asc, and, count as drizzleCount } from 'drizzle-orm'

export const categoryService = {
  async list(params: { page: number; pageSize: number; name?: string; status?: number }) {
    const { page, pageSize, name, status } = params
    const conditions: ReturnType<typeof eq>[] = []
    if (name) conditions.push(like(sysCategory.name, `%${name}%`))
    if (status !== undefined) conditions.push(eq(sysCategory.status, status))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [rows, countResult] = await Promise.all([
      db.select({
        id: sysCategory.id, name: sysCategory.name, code: sysCategory.code,
        description: sysCategory.description, sort: sysCategory.sort,
        status: sysCategory.status, remark: sysCategory.remark,
        createTime: sysCategory.createTime, updateTime: sysCategory.updateTime,
        contentCount: drizzleCount(sysContent.id),
      }).from(sysCategory)
        .leftJoin(sysContent, eq(sysCategory.id, sysContent.categoryId))
        .where(where)
        .orderBy(asc(sysCategory.sort))
        .groupBy(sysCategory.id)
        .offset((page - 1) * pageSize)
        .limit(pageSize),
      db.select({ count: drizzleCount() }).from(sysCategory).where(where),
    ])
    return { list: rows, total: countResult[0]?.count ?? 0, page, pageSize }
  },

  async findAll() {
    return db.select().from(sysCategory).orderBy(asc(sysCategory.sort))
  },

  async findById(id: number) {
    const [category] = await db.select().from(sysCategory).where(eq(sysCategory.id, id))
    if (!category) throw createError({ statusCode: 404, message: '分类不存在' })
    return category
  },

  async create(params: { name: string; code: string; description?: string; sort?: number; status?: number; remark?: string }) {
    const [existing] = await db.select().from(sysCategory).where(eq(sysCategory.code, params.code))
    if (existing) throw createError({ statusCode: 409, message: '分类编码已存在' })
    const now = new Date().toISOString().slice(0, 23).replace('T', ' ')
    const [result] = await db.insert(sysCategory).values({
      name: params.name, code: params.code, description: params.description || null,
      sort: params.sort ?? 0, status: params.status ?? 1, remark: params.remark || null,
      updateTime: now,
    })
    return { id: Number(result.insertId), ...params }
  },

  async update(id: number, params: { name?: string; code?: string; description?: string; sort?: number; status?: number; remark?: string }) {
    const category = await this.findById(id)
    if (params.code && params.code !== category.code) {
      const [existing] = await db.select().from(sysCategory).where(eq(sysCategory.code, params.code))
      if (existing) throw createError({ statusCode: 409, message: '分类编码已存在' })
    }
    await db.update(sysCategory).set(params).where(eq(sysCategory.id, id))
    return this.findById(id)
  },

  async delete(id: number) {
    const category = await this.findById(id)
    const [contentCountResult] = await db.select({ count: drizzleCount() }).from(sysContent).where(eq(sysContent.categoryId, id))
    const contentCount = contentCountResult?.count ?? 0
    if (contentCount > 0) throw createError({ statusCode: 400, message: '该分类下有内容，不能删除' })
    await db.delete(sysCategory).where(eq(sysCategory.id, id))
    return true
  },
}
