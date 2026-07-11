import prisma from '../utils/prisma'

export const merchantService = {
  async list(params: { page: number; pageSize: number; name?: string; categoryId?: number; regionId?: number; status?: number; level?: number; isFeatured?: number; keyword?: string }) {
    const { page, pageSize, name, categoryId, regionId, status, level, isFeatured, keyword } = params
    const where: Record<string, unknown> = {}
    if (name) where.name = { contains: name }
    if (categoryId !== undefined) where.categoryId = categoryId
    if (regionId !== undefined) where.regionId = regionId
    if (status !== undefined) where.status = status
    if (level !== undefined) where.level = level
    if (isFeatured !== undefined) where.isFeatured = isFeatured
    if (keyword) {
      where.OR = [{ name: { contains: keyword } }, { description: { contains: keyword } }, { address: { contains: keyword } }]
    }

    const [rows, total] = await Promise.all([
      prisma.sysMerchant.findMany({
        where, skip: (page - 1) * pageSize, take: pageSize,
        orderBy: [{ createTime: 'desc' }],
        include: {
          category: { select: { id: true, name: true, code: true } },
          region: { select: { id: true, name: true, nameEn: true, nameJp: true, parentId: true, level: true } },
        },
      }),
      prisma.sysMerchant.count({ where }),
    ])

    const list = rows.map(m => ({
      id: m.id, name: m.name, code: m.code,
      description: m.description, logo: m.logo, coverImage: m.coverImage,
      categoryId: m.categoryId, categoryName: m.category?.name,
      regionId: m.regionId, regionName: m.region ? (m.region.nameEn || m.region.nameJp || m.region.name) : undefined,
      contactName: m.contactName, contactPhone: m.contactPhone,
      address: m.address, longitude: m.longitude ? Number(m.longitude) : undefined,
      latitude: m.latitude ? Number(m.latitude) : undefined,
      status: m.status, level: m.level, tags: m.tags,
      deliveryFee: m.deliveryFee ? Number(m.deliveryFee) : undefined,
      minOrderAmount: m.minOrderAmount ? Number(m.minOrderAmount) : undefined,
      estimatedDeliveryTime: m.estimatedDeliveryTime,
      openTime: m.openTime, closeTime: m.closeTime,
      rating: m.rating ? Number(m.rating) : undefined, ratingCount: m.ratingCount,
      monthlySales: m.monthlySales, isFeatured: m.isFeatured, isNew: m.isNew,
      remark: m.remark, createTime: m.createTime, updateTime: m.updateTime,
    }))
    return { list, total, page, pageSize }
  },

  async listPublic(params: { page: number; pageSize: number; name?: string; categoryId?: number; keyword?: string; status?: number }) {
    const { page, pageSize, name, categoryId, keyword, status } = params
    const where: Record<string, unknown> = {}
    if (status !== undefined) where.status = status
    if (name) where.name = { contains: name }
    if (categoryId !== undefined) where.categoryId = categoryId
    if (keyword) {
      where.OR = [{ name: { contains: keyword } }, { description: { contains: keyword } }]
    }

    const [rows, total] = await Promise.all([
      prisma.sysMerchant.findMany({
        where, skip: (page - 1) * pageSize, take: pageSize,
        orderBy: [{ isFeatured: 'desc' }, { monthlySales: 'desc' }],
        include: { category: { select: { id: true, name: true } } },
      }),
      prisma.sysMerchant.count({ where }),
    ])
    const list = rows.map(m => ({
      id: m.id, name: m.name, description: m.description, logo: m.logo, coverImage: m.coverImage,
      categoryName: m.category?.name, address: m.address,
      rating: m.rating ? Number(m.rating) : undefined, ratingCount: m.ratingCount,
      monthlySales: m.monthlySales,
      deliveryFee: m.deliveryFee ? Number(m.deliveryFee) : undefined,
      minOrderAmount: m.minOrderAmount ? Number(m.minOrderAmount) : undefined,
      estimatedDeliveryTime: m.estimatedDeliveryTime,
      openTime: m.openTime, closeTime: m.closeTime,
      isFeatured: m.isFeatured, isNew: m.isNew,
    }))
    return { list, total, page, pageSize }
  },

  async findById(id: number) {
    const merchant = await prisma.sysMerchant.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, code: true } },
        region: { select: { id: true, name: true, nameEn: true, nameJp: true } },
        productCategories: {
          where: { status: 1 },
          orderBy: [{ sort: 'asc' }],
          select: { id: true, name: true, merchantId: true, sort: true, status: true },
        },
        products: {
          where: { status: 1 },
          orderBy: [{ sort: 'asc' }],
          select: {
            id: true, name: true, code: true, description: true, image: true,
            categoryId: true, merchantId: true, status: true, sales: true,
            isRecommended: true, sort: true, createTime: true,
            specs: {
              where: { status: 1 },
              orderBy: [{ sort: 'asc' }, { isDefault: 'desc' }],
              select: {
                id: true, productId: true, name: true, price: true, originalPrice: true,
                isDefault: true, stock: true, sort: true, status: true,
                unit: { select: { id: true, name: true, symbol: true } },
              },
            },
          },
        },
      },
    })
    if (!merchant) throw createError({ statusCode: 404, message: '商家不存在' })
    if (merchant.status === 0) throw createError({ statusCode: 410, message: '商家已休业' })
    if (merchant.status === 2) throw createError({ statusCode: 410, message: '商家已暂停营业' })

    const categories = merchant.productCategories.map(c => ({
      id: c.id, name: c.name, merchantId: c.merchantId, sort: c.sort, status: c.status,
    }))
    const products = merchant.products.map(p => ({
      id: p.id, name: p.name, code: p.code, description: p.description,
      image: p.image, categoryId: p.categoryId, merchantId: p.merchantId,
      status: p.status, sales: p.sales, isRecommended: p.isRecommended,
      sort: p.sort, createTime: p.createTime,
      specs: p.specs.map(s => ({
        id: s.id, productId: s.productId, name: s.name,
        price: Number(s.price), originalPrice: s.originalPrice ? Number(s.originalPrice) : undefined,
        isDefault: s.isDefault, stock: s.stock, sort: s.sort, status: s.status,
        unitId: s.unit?.id, unitName: s.unit?.name, unitSymbol: s.unit?.symbol,
      })),
      priceRange: undefined,
    }))

    return { ...merchant, categories, products }
  },

  async create(params: { name: string; code: string; categoryId: number; regionId?: number; description?: string; logo?: string; coverImage?: string; contactName?: string; contactPhone?: string; address?: string; longitude?: number; latitude?: number; status?: number; level?: number; tags?: string; deliveryFee?: number; minOrderAmount?: number; estimatedDeliveryTime?: number; openTime?: string; closeTime?: string; isFeatured?: number; isNew?: number; remark?: string }) {
    if (!params.name || !params.code || !params.categoryId) {
      throw createError({ statusCode: 400, message: '名称、编码和分类不能为空' })
    }
    const exist = await prisma.sysMerchant.findUnique({ where: { code: params.code } })
    if (exist) throw createError({ statusCode: 409, message: '商家编码已存在' })
    const category = await prisma.sysMerchantCategory.findUnique({ where: { id: params.categoryId } })
    if (!category) throw createError({ statusCode: 404, message: '商家分类不存在' })

    return prisma.sysMerchant.create({
      data: {
        name: params.name, code: params.code, categoryId: params.categoryId, regionId: params.regionId || null,
        description: params.description || null, logo: params.logo || null, coverImage: params.coverImage || null,
        contactName: params.contactName || null, contactPhone: params.contactPhone || null,
        address: params.address || null, longitude: params.longitude || null, latitude: params.latitude || null,
        status: params.status ?? 1, level: params.level ?? 0, tags: params.tags || null,
        deliveryFee: params.deliveryFee || null, minOrderAmount: params.minOrderAmount || null,
        estimatedDeliveryTime: params.estimatedDeliveryTime || null,
        openTime: params.openTime || null, closeTime: params.closeTime || null,
        isFeatured: params.isFeatured ?? 0, isNew: params.isNew ?? 0, remark: params.remark || null,
      },
    })
  },

  async update(id: number, params: { name?: string; code?: string; categoryId?: number; regionId?: number; description?: string; logo?: string; coverImage?: string; contactName?: string; contactPhone?: string; address?: string; longitude?: number; latitude?: number; status?: number; level?: number; tags?: string; deliveryFee?: number; minOrderAmount?: number; estimatedDeliveryTime?: number; openTime?: string; closeTime?: string; isFeatured?: number; isNew?: number; remark?: string }) {
    const merchant = await prisma.sysMerchant.findUnique({ where: { id } })
    if (!merchant) throw createError({ statusCode: 404, message: '商家不存在' })
    if (params.code && params.code !== merchant.code) {
      const exist = await prisma.sysMerchant.findUnique({ where: { code: params.code } })
      if (exist) throw createError({ statusCode: 409, message: '商家编码已存在' })
    }
    await prisma.sysMerchant.update({ where: { id }, data: params })
    return this.findById(id)
  },

  async delete(id: number) {
    const merchant = await prisma.sysMerchant.findUnique({ where: { id } })
    if (!merchant) throw createError({ statusCode: 404, message: '商家不存在' })
    const productCount = await prisma.sysProduct.count({ where: { merchantId: id } })
    if (productCount > 0) throw createError({ statusCode: 400, message: '该商家下有商品，不能删除' })
    await prisma.sysMerchant.delete({ where: { id } })
    return true
  },
}
