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
    prisma.sysDictType.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createTime: 'desc' },
      include: {
        _count: { select: { data: true } },
      },
    }),
    prisma.sysDictType.count({ where }),
  ])

  const list = rows.map(d => ({
    id: d.id,
    name: d.name,
    code: d.code,
    status: d.status,
    remark: d.remark,
    createTime: d.createTime,
    updateTime: d.updateTime,
    dataCount: d._count.data,
  }))

  return { code: 200, data: { list, total, page, pageSize } }
})
