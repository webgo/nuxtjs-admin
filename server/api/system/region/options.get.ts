import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const level = query.level !== undefined ? Number(query.level) : undefined
  const parentId = query.parentId !== undefined ? Number(query.parentId) : undefined
  const lang = query.lang as string | undefined

  const where: any = { status: 1 }
  if (level !== undefined) where.level = level
  if (parentId !== undefined) where.parentId = parentId
  if (lang) where.lang = lang

  const rows = await prisma.sysRegion.findMany({
    where,
    select: { id: true, name: true, nameEn: true, nameJp: true, level: true, parentId: true, lng: true, lat: true },
    orderBy: [{ sort: 'asc' }, { id: 'asc' }],
  })

  return { code: 200, data: rows }
})
