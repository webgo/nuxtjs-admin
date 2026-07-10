import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 10
  const merchantId = query.merchantId !== undefined ? Number(query.merchantId) : undefined
  const productId = query.productId !== undefined ? Number(query.productId) : undefined
  const rating = query.rating !== undefined ? Number(query.rating) : undefined

  const where: any = {}
  if (merchantId !== undefined) where.merchantId = merchantId
  if (productId !== undefined) where.productId = productId
  if (rating !== undefined) where.rating = rating

  const [rows, total] = await Promise.all([
    prisma.sysRating.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createTime: 'desc' },
      include: {
        product: { select: { name: true } },
      },
    }),
    prisma.sysRating.count({ where }),
  ])

  const userIds = [...new Set(rows.map(r => r.userId))]
  const users = await prisma.sysUser.findMany({
    where: { id: { in: userIds } },
    select: { id: true, username: true },
  })
  const userMap = new Map(users.map(u => [u.id, u.username]))

  const list = rows.map(r => ({
    id: r.id,
    orderId: r.orderId,
    userId: r.userId,
    username: userMap.get(r.userId),
    merchantId: r.merchantId,
    productId: r.productId,
    productName: r.product?.name,
    rating: r.rating,
    content: r.content,
    images: r.images,
    createTime: r.createTime,
  }))

  return { code: 200, data: { list, total, page, pageSize } }
})
