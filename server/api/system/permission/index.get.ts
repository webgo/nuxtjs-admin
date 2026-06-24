import prisma from '../../../utils/prisma'

export default defineEventHandler(async () => {
  const permissions = await prisma.sysPermission.findMany({
    orderBy: [{ sort: 'asc' }, { id: 'asc' }],
  })

  // 构建树形结构
  function buildTree(perms: any[], parentId: number): any[] {
    return perms
      .filter(p => p.parentId === parentId)
      .map(p => ({
        id: p.id,
        name: p.name,
        code: p.code,
        type: p.type,
        parentId: p.parentId,
        path: p.path,
        component: p.component,
        icon: p.icon,
        sort: p.sort,
        status: p.status,
        visible: p.visible,
        remark: p.remark,
        createTime: p.createTime,
        updateTime: p.updateTime,
        children: buildTree(perms, p.id),
      }))
  }

  const tree = buildTree(permissions, 0)

  return { code: 200, data: tree }
})
