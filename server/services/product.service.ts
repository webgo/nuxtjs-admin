import db from '../utils/db'
import { sysProduct, sysProductSpec, sysPriceUnit, sysMerchant, sysProductCategory } from '../../db/schema'
import { eq, like, asc, desc, and, not, inArray, count as drizzleCount } from 'drizzle-orm'

export const productService = {
  async list(params: { page: number; pageSize: number; merchantId?: number; categoryId?: number; name?: string; status?: number }) {
    const { page, pageSize, merchantId, categoryId, name, status } = params
    const conditions: ReturnType<typeof eq>[] = []
    if (merchantId !== undefined) conditions.push(eq(sysProduct.merchantId, merchantId))
    if (categoryId !== undefined) conditions.push(eq(sysProduct.categoryId, categoryId))
    if (name) conditions.push(like(sysProduct.name, `%${name}%`))
    if (status !== undefined) conditions.push(eq(sysProduct.status, status))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [rows, countResult] = await Promise.all([
      db.select({
        id: sysProduct.id, merchantId: sysProduct.merchantId, merchantName: sysMerchant.name,
        categoryId: sysProduct.categoryId, categoryName: sysProductCategory.name,
        name: sysProduct.name, code: sysProduct.code, description: sysProduct.description,
        image: sysProduct.image, status: sysProduct.status, sort: sysProduct.sort,
        sales: sysProduct.sales, unit: sysProduct.unit, isRecommended: sysProduct.isRecommended,
        createTime: sysProduct.createTime, updateTime: sysProduct.updateTime,
      }).from(sysProduct)
        .leftJoin(sysMerchant, eq(sysProduct.merchantId, sysMerchant.id))
        .leftJoin(sysProductCategory, eq(sysProduct.categoryId, sysProductCategory.id))
        .where(where)
        .orderBy(asc(sysProduct.sort))
        .offset((page - 1) * pageSize)
        .limit(pageSize),
      db.select({ count: drizzleCount() }).from(sysProduct).where(where),
    ])

    const productIds = rows.map(r => r.id)
    const specs = productIds.length > 0
      ? await db.select().from(sysProductSpec)
          .where(and(inArray(sysProductSpec.productId, productIds), eq(sysProductSpec.status, 1)))
          .orderBy(desc(sysProductSpec.isDefault))
      : []

    const specsByProduct = new Map<number, typeof specs>()
    for (const s of specs) {
      if (!specsByProduct.has(s.productId)) specsByProduct.set(s.productId, [])
      specsByProduct.get(s.productId)!.push(s)
    }

    const list = rows.map(p => ({
      ...p,
      specs: (specsByProduct.get(p.id) || []).map(s => ({
        id: s.id, name: s.name, price: Number(s.price),
        originalPrice: s.originalPrice ? Number(s.originalPrice) : undefined,
        isDefault: s.isDefault,
      })),
    }))
    return { list, total: countResult[0]?.count ?? 0, page, pageSize }
  },

  async listPublic(params: { page: number; pageSize: number; merchantId: number; categoryId?: number }) {
    const { page, pageSize, merchantId, categoryId } = params
    const conditions = [eq(sysProduct.merchantId, merchantId), eq(sysProduct.status, 1)]
    if (categoryId !== undefined) conditions.push(eq(sysProduct.categoryId, categoryId))
    const where = and(...conditions)

    const rows = await db.select({
      id: sysProduct.id, name: sysProduct.name, description: sysProduct.description,
      image: sysProduct.image, categoryName: sysProductCategory.name,
      sales: sysProduct.sales, unit: sysProduct.unit,
    }).from(sysProduct)
      .leftJoin(sysProductCategory, eq(sysProduct.categoryId, sysProductCategory.id))
      .where(where)
      .orderBy(asc(sysProduct.sort))

    const productIds = rows.map(r => r.id)
    const specs = productIds.length > 0
      ? await db.select().from(sysProductSpec)
          .where(and(inArray(sysProductSpec.productId, productIds), eq(sysProductSpec.status, 1)))
          .orderBy(desc(sysProductSpec.isDefault))
      : []

    const specsByProduct = new Map<number, typeof specs>()
    for (const s of specs) {
      if (!specsByProduct.has(s.productId)) specsByProduct.set(s.productId, [])
      specsByProduct.get(s.productId)!.push(s)
    }

    const list = rows.map(p => ({
      ...p,
      specs: (specsByProduct.get(p.id) || []).map(s => ({
        id: s.id, name: s.name, price: Number(s.price),
        originalPrice: s.originalPrice ? Number(s.originalPrice) : undefined,
        isDefault: s.isDefault,
      })),
    }))
    return { list, total: list.length, page, pageSize }
  },

  async findById(id: number) {
    const [product] = await db.select({
      id: sysProduct.id, merchantId: sysProduct.merchantId, merchantName: sysMerchant.name,
      categoryId: sysProduct.categoryId, categoryName: sysProductCategory.name,
      name: sysProduct.name, code: sysProduct.code, description: sysProduct.description,
      image: sysProduct.image, status: sysProduct.status, sort: sysProduct.sort,
      sales: sysProduct.sales, unit: sysProduct.unit, isRecommended: sysProduct.isRecommended,
      createTime: sysProduct.createTime, updateTime: sysProduct.updateTime,
    }).from(sysProduct)
      .leftJoin(sysMerchant, eq(sysProduct.merchantId, sysMerchant.id))
      .leftJoin(sysProductCategory, eq(sysProduct.categoryId, sysProductCategory.id))
      .where(eq(sysProduct.id, id))
    if (!product) throw createError({ statusCode: 404, message: '商品不存在' })

    const specs = await db.select().from(sysProductSpec)
      .where(eq(sysProductSpec.productId, id))
      .orderBy(desc(sysProductSpec.isDefault))

    return { ...product, specs }
  },

  async create(params: { merchantId: number; name: string; code: string; categoryId?: number; description?: string; image?: string; unit?: string; sort?: number; status?: number; isRecommended?: number; specs?: Array<{ name: string; price: number; originalPrice?: number; unitId?: number; isDefault?: number; stock?: number }> }) {
    const { specs, ...productData } = params
    const now = new Date().toISOString().slice(0, 23).replace('T', ' ')

    const [result] = await db.insert(sysProduct).values({
      ...productData,
      description: productData.description || null, image: productData.image || null,
      unit: productData.unit || null, sort: productData.sort ?? 0,
      status: productData.status ?? 1, isRecommended: productData.isRecommended ?? 0,
      updateTime: now,
    })
    const productId = Number(result.insertId)

    if (specs?.length) {
      await db.insert(sysProductSpec).values(specs.map(s => ({
        productId, name: s.name, price: String(s.price),
        originalPrice: s.originalPrice ? String(s.originalPrice) : null,
        unitId: s.unitId || null, isDefault: s.isDefault ?? 0,
        stock: s.stock ?? 0, status: 1, updateTime: now,
      })))
    }

    return this.findById(productId)
  },

  async update(id: number, params: { name?: string; code?: string; categoryId?: number; description?: string; image?: string; unit?: string; sort?: number; status?: number; isRecommended?: number }) {
    const product = await this.findById(id)
    await db.update(sysProduct).set(params).where(eq(sysProduct.id, id))
    return this.findById(id)
  },

  async delete(id: number) {
    const product = await this.findById(id)
    await db.delete(sysProductSpec).where(eq(sysProductSpec.productId, id))
    await db.delete(sysProduct).where(eq(sysProduct.id, id))
    return true
  },

  async addSpec(productId: number, data: { name: string; price: number; originalPrice?: number; unitId?: number; isDefault?: number; stock?: number }) {
    const product = await this.findById(productId)
    if (data.isDefault === 1) {
      await db.update(sysProductSpec).set({ isDefault: 0 })
        .where(and(eq(sysProductSpec.productId, productId), eq(sysProductSpec.isDefault, 1)))
    }
    const now = new Date().toISOString().slice(0, 23).replace('T', ' ')
    const [result] = await db.insert(sysProductSpec).values({
      productId, name: data.name, price: String(data.price),
      originalPrice: data.originalPrice ? String(data.originalPrice) : null,
      unitId: data.unitId || null, isDefault: data.isDefault ?? 0,
      stock: data.stock ?? 0, status: 1, updateTime: now,
    })
    return { id: Number(result.insertId), ...data }
  },

  async updateSpec(id: number, data: { name?: string; price?: number; originalPrice?: number; unitId?: number; isDefault?: number; stock?: number; status?: number }) {
    const [spec] = await db.select().from(sysProductSpec).where(eq(sysProductSpec.id, id))
    if (!spec) throw createError({ statusCode: 404, message: '规格不存在' })

    if (data.isDefault === 1) {
      await db.update(sysProductSpec).set({ isDefault: 0 })
        .where(and(
          eq(sysProductSpec.productId, spec.productId),
          eq(sysProductSpec.isDefault, 1),
          not(eq(sysProductSpec.id, id)),
        ))
    }

    const updateData: Record<string, unknown> = { ...data }
    if (data.price !== undefined) updateData.price = String(data.price)
    if (data.originalPrice !== undefined) updateData.originalPrice = data.originalPrice ? String(data.originalPrice) : null
    await db.update(sysProductSpec).set(updateData).where(eq(sysProductSpec.id, id))

    const [updated] = await db.select().from(sysProductSpec).where(eq(sysProductSpec.id, id))
    return updated
  },

  async deleteSpec(id: number) {
    const [spec] = await db.select().from(sysProductSpec).where(eq(sysProductSpec.id, id))
    if (!spec) throw createError({ statusCode: 404, message: '规格不存在' })
    await db.delete(sysProductSpec).where(eq(sysProductSpec.id, id))
    return true
  },
}
