import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 10
  const title = query.title as string | undefined
  const categoryId = query.categoryId !== undefined ? Number(query.categoryId) : undefined
  const isRecommended = query.isRecommended !== undefined ? Number(query.isRecommended) : undefined
  const status = query.status !== undefined ? Number(query.status) : undefined

  const where: any = {}
  if (title) where.title = { contains: title }
  if (categoryId) where.categoryId = categoryId
  if (isRecommended !== undefined) where.isRecommended = isRecommended
  if (status !== undefined) where.status = status

  const [rows, total] = await Promise.all([
    prisma.sysContent.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createTime: 'desc' },
      include: {
        category: { select: { id: true, name: true } },
      },
    }),
    prisma.sysContent.count({ where }),
  ])

  return { code: 200, data: { list: rows, total, page, pageSize } }
})
