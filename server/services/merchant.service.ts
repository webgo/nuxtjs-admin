import db from '../utils/db'
import { sysMerchant, sysMerchantCategory, sysRegion, sysProduct, sysProductSpec, sysPriceUnit, sysProductCategory } from '../../db/schema'
import { eq, and, like, desc, asc, count as drizzleCount, inArray } from 'drizzle-orm'

export const merchantService = {
  async list(params: { page: number; pageSize: number; name?: string; categoryId?: number; regionId?: number; status?: number; level?: number; isFeatured?: number; keyword?: string }) {
    const { page, pageSize, name, categoryId, regionId, status, level, isFeatured, keyword } = params
    const conditions = []
    if (name) conditions.push(like(sysMerchant.name, `%${name}%`))
    if (categoryId !== undefined) conditions.push(eq(sysMerchant.categoryId, categoryId))
    if (regionId !== undefined) conditions.push(eq(sysMerchant.regionId, regionId))
    if (status !== undefined) conditions.push(eq(sysMerchant.status, status))
    if (level !== undefined) conditions.push(eq(sysMerchant.level, level))
    if (isFeatured !== undefined) conditions.push(eq(sysMerchant.isFeatured, isFeatured))
    if (keyword) {
      conditions.push(like(sysMerchant.name, `%${keyword}%`))
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const baseQuery = db.select({
      id: sysMerchant.id, name: sysMerchant.name, code: sysMerchant.code,
      description: sysMerchant.description, logo: sysMerchant.logo, coverImage: sysMerchant.coverImage,
      categoryId: sysMerchant.categoryId, categoryName: sysMerchantCategory.name,
      regionId: sysMerchant.regionId, regionName: sysRegion.nameEn,
      contactName: sysMerchant.contactName, contactPhone: sysMerchant.contactPhone,
      address: sysMerchant.address, longitude: sysMerchant.longitude, latitude: sysMerchant.latitude,
      status: sysMerchant.status, level: sysMerchant.level, tags: sysMerchant.tags,
      deliveryFee: sysMerchant.deliveryFee, minOrderAmount: sysMerchant.minOrderAmount,
      estimatedDeliveryTime: sysMerchant.estimatedDeliveryTime,
      openTime: sysMerchant.openTime, closeTime: sysMerchant.closeTime,
      rating: sysMerchant.rating, ratingCount: sysMerchant.ratingCount,
      monthlySales: sysMerchant.monthlySales, isFeatured: sysMerchant.isFeatured, isNew: sysMerchant.isNew,
      remark: sysMerchant.remark, createTime: sysMerchant.createTime, updateTime: sysMerchant.updateTime,
    }).from(sysMerchant)
      .leftJoin(sysMerchantCategory, eq(sysMerchant.categoryId, sysMerchantCategory.id))
      .leftJoin(sysRegion, eq(sysMerchant.regionId, sysRegion.id))
      .where(where)
      .orderBy(desc(sysMerchant.createTime))

    const [countResult] = await db.select({ count: drizzleCount() }).from(sysMerchant).where(where)
    const total = Number(countResult?.count || 0)
    const rows = await baseQuery.limit(pageSize).offset((page - 1) * pageSize)

    const list = rows.map(m => ({
      ...m,
      regionName: m.regionName || undefined,
      longitude: m.longitude ? Number(m.longitude) : undefined,
      latitude: m.latitude ? Number(m.latitude) : undefined,
      deliveryFee: m.deliveryFee ? Number(m.deliveryFee) : undefined,
      minOrderAmount: m.minOrderAmount ? Number(m.minOrderAmount) : undefined,
      rating: m.rating ? Number(m.rating) : undefined,
    }))
    return { list, total, page, pageSize }
  },

  async listPublic(params: { page: number; pageSize: number; name?: string; categoryId?: number; keyword?: string; status?: number }) {
    const { page, pageSize, name, categoryId, keyword, status } = params
    const conditions = []
    if (status !== undefined) conditions.push(eq(sysMerchant.status, status))
    if (name) conditions.push(like(sysMerchant.name, `%${name}%`))
    if (categoryId !== undefined) conditions.push(eq(sysMerchant.categoryId, categoryId))
    if (keyword) conditions.push(like(sysMerchant.name, `%${keyword}%`))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const baseQuery = db.select({
      id: sysMerchant.id, name: sysMerchant.name, description: sysMerchant.description,
      logo: sysMerchant.logo, coverImage: sysMerchant.coverImage,
      categoryName: sysMerchantCategory.name, address: sysMerchant.address,
      rating: sysMerchant.rating, ratingCount: sysMerchant.ratingCount,
      monthlySales: sysMerchant.monthlySales, deliveryFee: sysMerchant.deliveryFee,
      minOrderAmount: sysMerchant.minOrderAmount, estimatedDeliveryTime: sysMerchant.estimatedDeliveryTime,
      openTime: sysMerchant.openTime, closeTime: sysMerchant.closeTime,
      isFeatured: sysMerchant.isFeatured, isNew: sysMerchant.isNew,
    }).from(sysMerchant)
      .leftJoin(sysMerchantCategory, eq(sysMerchant.categoryId, sysMerchantCategory.id))
      .where(where)
      .orderBy(desc(sysMerchant.isFeatured), desc(sysMerchant.monthlySales))

    const [countResult] = await db.select({ count: drizzleCount() }).from(sysMerchant).where(where)
    const total = Number(countResult?.count || 0)
    const rows = await baseQuery.limit(pageSize).offset((page - 1) * pageSize)

    const list = rows.map(m => ({
      ...m,
      rating: m.rating ? Number(m.rating) : undefined,
      deliveryFee: m.deliveryFee ? Number(m.deliveryFee) : undefined,
      minOrderAmount: m.minOrderAmount ? Number(m.minOrderAmount) : undefined,
    }))
    return { list, total, page, pageSize }
  },

  async findById(id: number) {
    const [merchant] = await db.select({
      id: sysMerchant.id, name: sysMerchant.name, code: sysMerchant.code,
      description: sysMerchant.description, logo: sysMerchant.logo, coverImage: sysMerchant.coverImage,
      categoryId: sysMerchant.categoryId, regionId: sysMerchant.regionId,
      contactName: sysMerchant.contactName, contactPhone: sysMerchant.contactPhone,
      address: sysMerchant.address, longitude: sysMerchant.longitude, latitude: sysMerchant.latitude,
      status: sysMerchant.status, level: sysMerchant.level, tags: sysMerchant.tags,
      deliveryFee: sysMerchant.deliveryFee, minOrderAmount: sysMerchant.minOrderAmount,
      estimatedDeliveryTime: sysMerchant.estimatedDeliveryTime,
      openTime: sysMerchant.openTime, closeTime: sysMerchant.closeTime,
      rating: sysMerchant.rating, ratingCount: sysMerchant.ratingCount,
      monthlySales: sysMerchant.monthlySales, isFeatured: sysMerchant.isFeatured, isNew: sysMerchant.isNew,
      remark: sysMerchant.remark, createTime: sysMerchant.createTime, updateTime: sysMerchant.updateTime,
    }).from(sysMerchant).where(eq(sysMerchant.id, id))

    if (!merchant) throw createError({ statusCode: 404, message: '商家不存在' })
    if (merchant.status === 0) throw createError({ statusCode: 410, message: '商家已休业' })
    if (merchant.status === 2) throw createError({ statusCode: 410, message: '商家已暂停营业' })

    const categories = await db.select({
      id: sysProductCategory.id, name: sysProductCategory.name,
      merchantId: sysProductCategory.merchantId, sort: sysProductCategory.sort, status: sysProductCategory.status,
    }).from(sysProductCategory)
      .where(and(eq(sysProductCategory.merchantId, id), eq(sysProductCategory.status, 1)))
      .orderBy(asc(sysProductCategory.sort))

    const products = await db.select({
      id: sysProduct.id, name: sysProduct.name, code: sysProduct.code, description: sysProduct.description,
      image: sysProduct.image, categoryId: sysProduct.categoryId, merchantId: sysProduct.merchantId,
      status: sysProduct.status, sales: sysProduct.sales, isRecommended: sysProduct.isRecommended,
      sort: sysProduct.sort, createTime: sysProduct.createTime,
    }).from(sysProduct)
      .where(and(eq(sysProduct.merchantId, id), eq(sysProduct.status, 1)))
      .orderBy(asc(sysProduct.sort))

    const productIds = products.map(p => p.id)
    const allSpecs = productIds.length > 0
      ? await db.select({
          id: sysProductSpec.id, productId: sysProductSpec.productId, name: sysProductSpec.name,
          price: sysProductSpec.price, originalPrice: sysProductSpec.originalPrice,
          isDefault: sysProductSpec.isDefault, stock: sysProductSpec.stock,
          sort: sysProductSpec.sort, status: sysProductSpec.status,
          unitId: sysPriceUnit.id, unitName: sysPriceUnit.name, unitSymbol: sysPriceUnit.symbol,
        }).from(sysProductSpec)
          .leftJoin(sysPriceUnit, eq(sysProductSpec.unitId, sysPriceUnit.id))
          .where(and(eq(sysProductSpec.status, 1), inArray(sysProductSpec.productId, productIds)))
          .orderBy(asc(sysProductSpec.sort), desc(sysProductSpec.isDefault))
      : []

    const specsByProduct = new Map<number, typeof allSpecs>()
    for (const s of allSpecs) {
      if (!specsByProduct.has(s.productId)) specsByProduct.set(s.productId, [])
      specsByProduct.get(s.productId)!.push(s)
    }

    const enrichedProducts = products.map(p => ({
      ...p,
      specs: (specsByProduct.get(p.id) || []).map(s => ({
        id: s.id, productId: s.productId, name: s.name,
        price: Number(s.price), originalPrice: s.originalPrice ? Number(s.originalPrice) : undefined,
        isDefault: s.isDefault, stock: s.stock, sort: s.sort, status: s.status,
        unitId: s.unitId, unitName: s.unitName, unitSymbol: s.unitSymbol,
      })),
      priceRange: undefined,
    }))

    return { ...merchant, categories, products: enrichedProducts }
  },

  async create(params: { name: string; code: string; categoryId: number; regionId?: number; description?: string; logo?: string; coverImage?: string; contactName?: string; contactPhone?: string; address?: string; longitude?: number; latitude?: number; status?: number; level?: number; tags?: string; deliveryFee?: number; minOrderAmount?: number; estimatedDeliveryTime?: number; openTime?: string; closeTime?: string; isFeatured?: number; isNew?: number; remark?: string }) {
    if (!params.name || !params.code || !params.categoryId) throw createError({ statusCode: 400, message: '名称、编码和分类不能为空' })

    const [exist] = await db.select().from(sysMerchant).where(eq(sysMerchant.code, params.code))
    if (exist) throw createError({ statusCode: 409, message: '商家编码已存在' })

    const [category] = await db.select().from(sysMerchantCategory).where(eq(sysMerchantCategory.id, params.categoryId))
    if (!category) throw createError({ statusCode: 404, message: '商家分类不存在' })

    const now = new Date().toISOString().slice(0, 23).replace('T', ' ')
    const [result] = await db.insert(sysMerchant).values({
      name: params.name, code: params.code, categoryId: params.categoryId, regionId: params.regionId || null,
      description: params.description || null, logo: params.logo || null, coverImage: params.coverImage || null,
      contactName: params.contactName || null, contactPhone: params.contactPhone || null,
      address: params.address || null, longitude: String(params.longitude || 0), latitude: String(params.latitude || 0),
      status: params.status ?? 1, level: params.level ?? 0, tags: params.tags || null,
      deliveryFee: params.deliveryFee ? String(params.deliveryFee) : null,
      minOrderAmount: params.minOrderAmount ? String(params.minOrderAmount) : null,
      estimatedDeliveryTime: params.estimatedDeliveryTime || null,
      openTime: params.openTime || null, closeTime: params.closeTime || null,
      isFeatured: params.isFeatured ?? 0, isNew: params.isNew ?? 0, remark: params.remark || null,
      updateTime: now,
    }).execute()
    return { id: Number((result as any).insertId) }
  },

  async update(id: number, params: { name?: string; code?: string; categoryId?: number; regionId?: number; description?: string; logo?: string; coverImage?: string; contactName?: string; contactPhone?: string; address?: string; longitude?: number; latitude?: number; status?: number; level?: number; tags?: string; deliveryFee?: number; minOrderAmount?: number; estimatedDeliveryTime?: number; openTime?: string; closeTime?: string; isFeatured?: number; isNew?: number; remark?: string }) {
    const [merchant] = await db.select().from(sysMerchant).where(eq(sysMerchant.id, id))
    if (!merchant) throw createError({ statusCode: 404, message: '商家不存在' })
    if (params.code && params.code !== merchant.code) {
      const [exist] = await db.select().from(sysMerchant).where(eq(sysMerchant.code, params.code))
      if (exist) throw createError({ statusCode: 409, message: '商家编码已存在' })
    }
    const updateData: Record<string, any> = { ...params }
    if (params.longitude !== undefined) updateData.longitude = String(params.longitude)
    if (params.latitude !== undefined) updateData.latitude = String(params.latitude)
    if (params.deliveryFee !== undefined) updateData.deliveryFee = String(params.deliveryFee)
    if (params.minOrderAmount !== undefined) updateData.minOrderAmount = String(params.minOrderAmount)
    await db.update(sysMerchant).set(updateData).where(eq(sysMerchant.id, id))
    return this.findById(id)
  },

  async delete(id: number) {
    const [merchant] = await db.select().from(sysMerchant).where(eq(sysMerchant.id, id))
    if (!merchant) throw createError({ statusCode: 404, message: '商家不存在' })
    const [productCount] = await db.select({ count: drizzleCount() }).from(sysProduct).where(eq(sysProduct.merchantId, id))
    if (Number(productCount?.count || 0) > 0) throw createError({ statusCode: 400, message: '该商家下有商品，不能删除' })
    await db.delete(sysMerchant).where(eq(sysMerchant.id, id))
    return true
  },
}
