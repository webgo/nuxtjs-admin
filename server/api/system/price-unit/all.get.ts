import prisma from '../../../utils/prisma'

export default defineEventHandler(async () => {
  const rows = await prisma.sysPriceUnit.findMany({
    where: { status: 1 },
    orderBy: [{ sort: 'asc' }, { id: 'asc' }],
  })
  return { code: 200, data: rows }
})
