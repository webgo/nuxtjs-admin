import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth

  // 获取用户所有角色关联的权限（菜单+目录+按钮）
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
      menus: {
        include: {
          permission: true,
        },
      },
    },
  })

  if (!user) {
    throw createError({ statusCode: 404, message: '用户不存在' })
  }

  // 获取所有权限（来自角色和单独分配的菜单）
  const permSet = new Map<number, any>()

  for (const ur of user.roles) {
    for (const rp of ur.role.permissions) {
      const p = rp.permission
      if (p.status === 1) {
        permSet.set(p.id, p)
      }
    }
  }
  for (const um of user.menus) {
    const p = um.permission
    if (p.status === 1) {
      permSet.set(p.id, p)
    }
  }

  const allPerms = [...permSet.values()]

  // 构建树形菜单（只返回目录和菜单，按钮不返回）
  const menuPerms = allPerms.filter(p => p.type === 0 || p.type === 1)

  function buildTree(perms: any[], parentId: number): any[] {
    return perms
      .filter(p => p.parentId === parentId)
      .sort((a, b) => a.sort - b.sort)
      .map(p => ({
        id: p.id,
        name: p.name,
        code: p.code,
        type: p.type,
        path: p.path,
        icon: p.icon,
        sort: p.sort,
        visible: p.visible,
        children: buildTree(perms, p.id),
      }))
  }

  const menuTree = buildTree(menuPerms, 0)

  return {
    code: 200,
    data: menuTree,
  }
})
