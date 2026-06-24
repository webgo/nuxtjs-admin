import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 10
  const fileName = query.fileName as string | undefined
  const fileType = query.fileType as string | undefined
  const module = query.module as string | undefined

  const where: any = { status: 1 }
  if (fileName) where.fileName = { contains: fileName }
  if (fileType) where.fileType = { contains: fileType }
  if (module) where.module = module

  const [rows, total] = await Promise.all([
    prisma.sysFile.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createTime: 'desc' },
    }),
    prisma.sysFile.count({ where }),
  ])

  return { code: 200, data: { list: rows, total, page, pageSize } }
})
