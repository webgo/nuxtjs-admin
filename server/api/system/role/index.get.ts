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
    prisma.sysRole.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { sort: 'asc' },
      include: {
        _count: { select: { users: true } },
      },
    }),
    prisma.sysRole.count({ where }),
  ])

  const list = rows.map(r => ({
    id: r.id,
    name: r.name,
    code: r.code,
    description: r.description,
    status: r.status,
    sort: r.sort,
    remark: r.remark,
    createTime: r.createTime,
    updateTime: r.updateTime,
    userCount: r._count.users,
  }))

  return { code: 200, data: { list, total, page, pageSize } }
})
