import db from '../utils/db'
import { sysDictType, sysDictData } from '../../db/schema'
import { eq, like, asc, desc, and, count as drizzleCount } from 'drizzle-orm'

export const dictService = {
  async typeList(params: { page: number; pageSize: number; name?: string; code?: string; status?: number }) {
    const { page, pageSize, name, code, status } = params
    const conditions: ReturnType<typeof eq>[] = []
    if (name) conditions.push(like(sysDictType.name, `%${name}%`))
    if (code) conditions.push(like(sysDictType.code, `%${code}%`))
    if (status !== undefined) conditions.push(eq(sysDictType.status, status))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [rows, countResult] = await Promise.all([
      db.select({
        id: sysDictType.id, name: sysDictType.name, code: sysDictType.code,
        status: sysDictType.status, remark: sysDictType.remark,
        createTime: sysDictType.createTime, updateTime: sysDictType.updateTime,
        dataCount: drizzleCount(sysDictData.id),
      }).from(sysDictType)
        .leftJoin(sysDictData, eq(sysDictType.id, sysDictData.dictTypeId))
        .where(where)
        .orderBy(desc(sysDictType.createTime))
        .groupBy(sysDictType.id)
        .offset((page - 1) * pageSize)
        .limit(pageSize),
      db.select({ count: drizzleCount() }).from(sysDictType).where(where),
    ])
    return { list: rows, total: countResult[0]?.count ?? 0, page, pageSize }
  },

  async typeFindById(id: number) {
    const [dictType] = await db.select().from(sysDictType).where(eq(sysDictType.id, id))
    if (!dictType) throw createError({ statusCode: 404, message: '字典类型不存在' })
    return dictType
  },

  async typeCreate(params: { name: string; code: string; status?: number; remark?: string }) {
    const [existing] = await db.select().from(sysDictType).where(eq(sysDictType.code, params.code))
    if (existing) throw createError({ statusCode: 409, message: '字典类型编码已存在' })
    const now = new Date().toISOString().slice(0, 23).replace('T', ' ')
    const [result] = await db.insert(sysDictType).values({ ...params, updateTime: now })
    return { id: Number(result.insertId), ...params }
  },

  async typeUpdate(id: number, params: { name?: string; code?: string; status?: number; remark?: string }) {
    const dictType = await this.typeFindById(id)
    if (params.code && params.code !== dictType.code) {
      const [existing] = await db.select().from(sysDictType).where(eq(sysDictType.code, params.code))
      if (existing) throw createError({ statusCode: 409, message: '字典类型编码已存在' })
    }
    await db.update(sysDictType).set(params).where(eq(sysDictType.id, id))
    return this.typeFindById(id)
  },

  async typeDelete(id: number) {
    const dictType = await this.typeFindById(id)
    await db.delete(sysDictData).where(eq(sysDictData.dictTypeId, id))
    await db.delete(sysDictType).where(eq(sysDictType.id, id))
    return true
  },

  async dataList(params: { page?: number; pageSize?: number; dictTypeId?: number; dictCode?: string; label?: string; status?: number }) {
    const { page = 1, pageSize = 10, dictTypeId, dictCode, label, status } = params
    const conditions: ReturnType<typeof eq>[] = []
    if (dictTypeId) conditions.push(eq(sysDictData.dictTypeId, dictTypeId))
    if (dictCode) conditions.push(eq(sysDictType.code, dictCode))
    if (label) conditions.push(like(sysDictData.label, `%${label}%`))
    if (status !== undefined) conditions.push(eq(sysDictData.status, status))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [rows, countResult] = await Promise.all([
      db.select({
        id: sysDictData.id, dictTypeId: sysDictData.dictTypeId,
        dictName: sysDictType.name, dictCode: sysDictType.code,
        label: sysDictData.label, value: sysDictData.value, sort: sysDictData.sort,
        status: sysDictData.status, cssClass: sysDictData.cssClass, remark: sysDictData.remark,
        createTime: sysDictData.createTime, updateTime: sysDictData.updateTime,
      }).from(sysDictData)
        .innerJoin(sysDictType, eq(sysDictData.dictTypeId, sysDictType.id))
        .where(where)
        .orderBy(asc(sysDictData.sort), asc(sysDictData.id))
        .offset((page - 1) * pageSize)
        .limit(pageSize),
      db.select({ count: drizzleCount() }).from(sysDictData)
        .innerJoin(sysDictType, eq(sysDictData.dictTypeId, sysDictType.id))
        .where(where),
    ])
    return { list: rows, total: countResult[0]?.count ?? 0, page, pageSize }
  },

  async dataFindById(id: number) {
    const [dictData] = await db.select().from(sysDictData).where(eq(sysDictData.id, id))
    if (!dictData) throw createError({ statusCode: 404, message: '字典数据不存在' })
    return dictData
  },

  async dataCreate(params: { dictTypeId: number; label: string; value: string; sort?: number; status?: number; cssClass?: string; remark?: string }) {
    const now = new Date().toISOString().slice(0, 23).replace('T', ' ')
    const [result] = await db.insert(sysDictData).values({ ...params, updateTime: now })
    return { id: Number(result.insertId), ...params }
  },

  async dataUpdate(id: number, params: { label?: string; value?: string; sort?: number; status?: number; cssClass?: string; remark?: string }) {
    const dictData = await this.dataFindById(id)
    await db.update(sysDictData).set(params).where(eq(sysDictData.id, id))
    return this.dataFindById(id)
  },

  async dataDelete(id: number) {
    const dictData = await this.dataFindById(id)
    await db.delete(sysDictData).where(eq(sysDictData.id, id))
    return true
  },

  async getDataByTypeCode(code: string) {
    const [dictType] = await db.select().from(sysDictType).where(eq(sysDictType.code, code))
    if (!dictType) return []
    return db.select().from(sysDictData)
      .where(and(eq(sysDictData.dictTypeId, dictType.id), eq(sysDictData.status, 1)))
      .orderBy(asc(sysDictData.sort))
  },
}
