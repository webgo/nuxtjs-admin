import prisma from '../../../utils/prisma'

// GET /api/system/role/all - 获取所有角色（用于下拉选择）
export default defineEventHandler(async () => {
  const roles = await prisma.sysRole.findMany({
    where: { status: 1 },
    orderBy: { sort: 'asc' },
    select: { id: true, name: true, code: true },
  })

  return { code: 200, data: roles }
})
