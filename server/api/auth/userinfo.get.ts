import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) {
    throw createError({ statusCode: 401, message: '未认证' })
  }

  const user = await prisma.sysUser.findUnique({
    where: { id: auth.userId },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!user) {
    throw createError({ statusCode: 404, message: '用户不存在' })
  }

  // 提取角色和权限
  const roles = user.roles.map(ur => ur.role.code)
  const permissions = [
    ...new Set(
      user.roles.flatMap(ur =>
        ur.role.permissions.map(rp => rp.permission.code).filter(Boolean)
      )
    ),
  ] as string[]

  return {
    code: 200,
    data: {
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        status: user.status,
      },
      roles,
      permissions,
    },
  }
})
