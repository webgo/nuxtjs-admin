import prisma from '../../../utils/prisma'

export default defineEventHandler(async () => {
  const rows = await prisma.sysMerchantCategory.findMany({
    where: { status: 1 },
    orderBy: { sort: 'asc' },
  })
  return { code: 200, data: rows }
})
