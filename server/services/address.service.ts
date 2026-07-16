import db from '../utils/db'
import { sysUserAddress } from '../../db/schema'
import { eq, and, desc } from 'drizzle-orm'

export const addressService = {
  async list(userId: number) {
    return db.select().from(sysUserAddress)
      .where(eq(sysUserAddress.userId, userId))
      .orderBy(desc(sysUserAddress.isDefault), desc(sysUserAddress.createTime))
  },

  async findById(id: number, userId: number) {
    const [address] = await db.select().from(sysUserAddress).where(eq(sysUserAddress.id, id))
    if (!address) throw createError({ statusCode: 404, message: '地址不存在' })
    if (address.userId !== userId) throw createError({ statusCode: 403, message: '无权访问' })
    return address
  },

  async create(params: { userId: number; name: string; phone: string; detail: string; label?: string; province?: string; city?: string; district?: string; isDefault?: number }) {
    const { userId, name, phone, detail, label, province, city, district, isDefault } = params
    if (isDefault === 1) {
      await db.update(sysUserAddress).set({ isDefault: 0 })
        .where(and(eq(sysUserAddress.userId, userId), eq(sysUserAddress.isDefault, 1)))
    }
    const now = new Date().toISOString().slice(0, 23).replace('T', ' ')
    const [result] = await db.insert(sysUserAddress).values({
      userId, label: label || null, name, phone,
      province: province || null, city: city || null, district: district || null,
      detail, isDefault: isDefault || 0, updateTime: now,
    }).execute()
    const insertId = Number((result as any).insertId)
    const [address] = await db.select().from(sysUserAddress).where(eq(sysUserAddress.id, insertId))
    return address!
  },

  async update(id: number, userId: number, params: { name?: string; phone?: string; detail?: string; label?: string; province?: string; city?: string; district?: string; isDefault?: number }) {
    const [address] = await db.select().from(sysUserAddress).where(eq(sysUserAddress.id, id))
    if (!address) throw createError({ statusCode: 404, message: '地址不存在' })
    if (address.userId !== userId) throw createError({ statusCode: 403, message: '无权操作' })

    if (params.isDefault === 1) {
      await db.update(sysUserAddress).set({ isDefault: 0 })
        .where(and(eq(sysUserAddress.userId, userId), eq(sysUserAddress.isDefault, 1)))
    }
    await db.update(sysUserAddress).set(params).where(eq(sysUserAddress.id, id))
    const [updated] = await db.select().from(sysUserAddress).where(eq(sysUserAddress.id, id))
    return updated!
  },

  async delete(id: number, userId: number) {
    const [address] = await db.select().from(sysUserAddress).where(eq(sysUserAddress.id, id))
    if (!address) throw createError({ statusCode: 404, message: '地址不存在' })
    if (address.userId !== userId) throw createError({ statusCode: 403, message: '无权操作' })
    await db.delete(sysUserAddress).where(eq(sysUserAddress.id, id))
    return true
  },

  async setDefault(id: number, userId: number) {
    const [address] = await db.select().from(sysUserAddress).where(eq(sysUserAddress.id, id))
    if (!address) throw createError({ statusCode: 404, message: '地址不存在' })
    if (address.userId !== userId) throw createError({ statusCode: 403, message: '无权操作' })

    await db.update(sysUserAddress).set({ isDefault: 0 }).where(eq(sysUserAddress.userId, userId))
    await db.update(sysUserAddress).set({ isDefault: 1 }).where(eq(sysUserAddress.id, id))
    const [updated] = await db.select().from(sysUserAddress).where(eq(sysUserAddress.id, id))
    return updated!
  },
}
