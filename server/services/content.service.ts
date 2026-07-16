import db from '../utils/db'
import { sysContent, sysCategory } from '../../db/schema'
import { eq, like, desc, and, count, sql } from 'drizzle-orm'

export const contentService = {
  async list(params: { page: number; pageSize: number; title?: string; categoryId?: number; isRecommended?: number; status?: number }) {
    const { page, pageSize, title, categoryId, isRecommended, status } = params
    const conditions: ReturnType<typeof eq>[] = []
    if (title) conditions.push(like(sysContent.title, `%${title}%`))
    if (categoryId !== undefined) conditions.push(eq(sysContent.categoryId, categoryId))
    if (isRecommended !== undefined) conditions.push(eq(sysContent.isRecommended, isRecommended))
    if (status !== undefined) conditions.push(eq(sysContent.status, status))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [rows, countResult] = await Promise.all([
      db.select({
        id: sysContent.id, title: sysContent.title, thumbnail: sysContent.thumbnail,
        summary: sysContent.summary, content: sysContent.content,
        categoryId: sysContent.categoryId, isRecommended: sysContent.isRecommended,
        status: sysContent.status, clickCount: sysContent.clickCount,
        remark: sysContent.remark, createTime: sysContent.createTime, updateTime: sysContent.updateTime,
        category: {
          id: sysCategory.id, name: sysCategory.name,
        },
      }).from(sysContent)
        .leftJoin(sysCategory, eq(sysContent.categoryId, sysCategory.id))
        .where(where)
        .orderBy(desc(sysContent.createTime))
        .offset((page - 1) * pageSize)
        .limit(pageSize),
      db.select({ count: count() }).from(sysContent).where(where),
    ])
    return { list: rows, total: countResult[0]?.count ?? 0, page, pageSize }
  },

  async findById(id: number) {
    const [content] = await db.select({
      id: sysContent.id, title: sysContent.title, thumbnail: sysContent.thumbnail,
      summary: sysContent.summary, content: sysContent.content,
      categoryId: sysContent.categoryId, isRecommended: sysContent.isRecommended,
      status: sysContent.status, clickCount: sysContent.clickCount,
      remark: sysContent.remark, createTime: sysContent.createTime, updateTime: sysContent.updateTime,
      category: {
        id: sysCategory.id, name: sysCategory.name,
      },
    }).from(sysContent)
      .leftJoin(sysCategory, eq(sysContent.categoryId, sysCategory.id))
      .where(eq(sysContent.id, id))
    if (!content) throw createError({ statusCode: 404, message: '内容不存在' })
    return content
  },

  async create(params: { title: string; thumbnail?: string; summary?: string; content?: string; categoryId?: number; isRecommended?: number; status?: number; remark?: string }) {
    if (!params.title) throw createError({ statusCode: 400, message: '内容标题不能为空' })
    const now = new Date().toISOString().slice(0, 23).replace('T', ' ')
    const [result] = await db.insert(sysContent).values({
      title: params.title, thumbnail: params.thumbnail || null, summary: params.summary || null,
      content: params.content || null, categoryId: params.categoryId || null,
      isRecommended: params.isRecommended ?? 0, status: params.status ?? 1, remark: params.remark || null,
      updateTime: now,
    })
    return { id: Number(result.insertId), ...params }
  },

  async update(id: number, params: { title?: string; thumbnail?: string; summary?: string; content?: string; categoryId?: number; isRecommended?: number; status?: number; remark?: string }) {
    const content = await this.findById(id)
    await db.update(sysContent).set(params).where(eq(sysContent.id, id))
    return this.findById(id)
  },

  async delete(id: number) {
    const content = await this.findById(id)
    await db.delete(sysContent).where(eq(sysContent.id, id))
    return true
  },

  async incrementClickCount(id: number) {
    await db.update(sysContent)
      .set({ clickCount: sql`${sysContent.clickCount} + 1` })
      .where(eq(sysContent.id, id))
  },
}
