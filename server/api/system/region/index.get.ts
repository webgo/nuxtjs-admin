import prisma from '../../../utils/prisma'

function buildTree(regions: any[], parentId: number | null = null): any[] {
  return regions
    .filter(r => r.parentId === parentId)
    .map(r => ({
      ...r,
      children: buildTree(regions, r.id),
    }))
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const tree = query.tree === 'true' || query.tree === '1'
  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 10
  const name = query.name as string | undefined
  const level = query.level !== undefined ? Number(query.level) : undefined
  const parentId = query.parentId !== undefined ? Number(query.parentId) : undefined
  const lang = query.lang as string | undefined
  const status = query.status !== undefined ? Number(query.status) : undefined

  const where: any = {}
  if (name) where.name = { contains: name }
  if (level !== undefined) where.level = level
  if (parentId !== undefined) where.parentId = parentId
  if (lang) where.lang = lang
  if (status !== undefined) where.status = status

  if (tree) {
    const all = await prisma.sysRegion.findMany({
      where,
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    })
    const list = buildTree(all, null)
    return { code: 200, data: { list } }
  }

  const [rows, total] = await Promise.all([
    prisma.sysRegion.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
      include: {
        parent: { select: { id: true, name: true, nameEn: true, nameJp: true } },
      },
    }),
    prisma.sysRegion.count({ where }),
  ])

  const list = rows.map(r => ({
    id: r.id,
    name: r.name,
    nameTw: r.nameTw,
    nameEn: r.nameEn,
    nameJp: r.nameJp,
    level: r.level,
    parentId: r.parentId,
    parentName: r.parent
      ? (r.parent.nameEn || r.parent.nameJp || r.parent.name)
      : null,
    lang: r.lang,
    lng: r.lng,
    lat: r.lat,
    sort: r.sort,
    status: r.status,
    remark: r.remark,
    createTime: r.createTime,
    updateTime: r.updateTime,
  }))

  return { code: 200, data: { list, total, page, pageSize } }
})
