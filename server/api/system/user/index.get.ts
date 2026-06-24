import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 10
  const username = query.username as string | undefined
  const status = query.status !== undefined ? Number(query.status) : undefined

  const where: any = {}
  if (username) where.username = { contains: username }
  if (status !== undefined) where.status = status

  const [rows, total] = await Promise.all([
    prisma.sysUser.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createTime: 'desc' },
      include: {
        roles: {
          include: { role: true },
        },
      },
    }),
    prisma.sysUser.count({ where }),
  ])

  const list = rows.map(u => ({
    id: u.id,
    username: u.username,
    nickname: u.nickname,
    email: u.email,
    phone: u.phone,
    avatar: u.avatar,
    status: u.status,
    remark: u.remark,
    createTime: u.createTime,
    updateTime: u.updateTime,
    roles: u.roles.map(ur => ({ id: ur.role.id, name: ur.role.name, code: ur.role.code })),
  }))

  return { code: 200, data: { list, total, page, pageSize } }
})
