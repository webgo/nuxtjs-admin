import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 10
  const dictTypeId = query.dictTypeId ? Number(query.dictTypeId) : undefined
  const label = query.label as string | undefined
  const status = query.status !== undefined ? Number(query.status) : undefined

  const where: any = {}
  if (dictTypeId) where.dictTypeId = dictTypeId
  if (label) where.label = { contains: label }
  if (status !== undefined) where.status = status

  const [rows, total] = await Promise.all([
    prisma.sysDictData.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
      include: {
        dictType: { select: { name: true, code: true } },
      },
    }),
    prisma.sysDictData.count({ where }),
  ])

  const list = rows.map(d => ({
    id: d.id,
    dictTypeId: d.dictTypeId,
    dictName: d.dictType.name,
    dictCode: d.dictType.code,
    label: d.label,
    value: d.value,
    sort: d.sort,
    status: d.status,
    remark: d.remark,
    createTime: d.createTime,
    updateTime: d.updateTime,
  }))

  return { code: 200, data: { list, total, page, pageSize } }
})
