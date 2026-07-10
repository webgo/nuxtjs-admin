import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const merchantId = query.merchantId ? Number(query.merchantId) : undefined

  if (!merchantId) {
    return { code: 200, data: { list: [], total: 0, page: 1, pageSize: 10 } }
  }

  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 10
  const name = query.name as string | undefined
  const status = query.status !== undefined ? Number(query.status) : undefined

  const where: any = { merchantId }
  if (name) where.name = { contains: name }
  if (status !== undefined) where.status = status

  const [rows, total] = await Promise.all([
    prisma.sysProductCategory.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { sort: 'asc' },
      include: {
        merchant: { select: { name: true } },
      },
    }),
    prisma.sysProductCategory.count({ where }),
  ])

  const list = rows.map(c => ({
    id: c.id,
    name: c.name,
    merchantId: c.merchantId,
    merchantName: c.merchant.name,
    sort: c.sort,
    status: c.status,
    remark: c.remark,
    createTime: c.createTime,
    updateTime: c.updateTime,
  }))

  return { code: 200, data: { list, total, page, pageSize } }
})
