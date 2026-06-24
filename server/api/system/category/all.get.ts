import prisma from '../../../utils/prisma'

export default defineEventHandler(async () => {
  const list = await prisma.sysCategory.findMany({
    where: { status: 1 },
    orderBy: { sort: 'asc' },
  })
  return { code: 200, data: { list } }
})
