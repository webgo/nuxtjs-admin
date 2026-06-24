import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 10
  const name = query.name as string | undefined
  const code = query.code as string | undefined
  const status = query.status !== undefined ? Number(query.status) : undefined

  const where: any = {}
  if (name) where.name = { contains: name }
  if (code) where.code = { contains: code }
  if (status !== undefined) where.status = status

  const [rows, total] = await Promise.all([
    prisma.sysCategory.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ sort: 'asc' }, { createTime: 'desc' }],
    }),
    prisma.sysCategory.count({ where }),
  ])

  return { code: 200, data: { list: rows, total, page, pageSize } }
})
