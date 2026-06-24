/// <reference types="node" />
import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import bcrypt from 'bcryptjs'

const adapter = new PrismaMariaDb({
  user: 'root',
  password: 'root',
  database: 'admin_app',
  host: 'localhost',
  port: 3306,
  connectionLimit: 1,
})
const prisma = new PrismaClient({ adapter })

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)

  // 1. 创建权限/菜单
  const permissions = [
    // 顶级目录
    { id: 1, name: '系统管理', code: 'system', type: 0, parentId: 0, path: '/system', icon: 'Setting', sort: 1, status: 1, visible: 1 },
    { id: 2, name: '系统监控', code: 'monitor', type: 0, parentId: 0, path: '/monitor', icon: 'Monitor', sort: 2, status: 1, visible: 1 },

    // 系统管理 -> 子菜单
    { id: 10, name: '用户管理', code: 'system:user', type: 1, parentId: 1, path: '/system/user', icon: 'User', sort: 1, status: 1, visible: 1 },
    { id: 11, name: '角色管理', code: 'system:role', type: 1, parentId: 1, path: '/system/role', icon: 'Avatar', sort: 2, status: 1, visible: 1 },
    { id: 12, name: '菜单管理', code: 'system:permission', type: 1, parentId: 1, path: '/system/permission', icon: 'Menu', sort: 3, status: 1, visible: 1 },
    { id: 13, name: '字典管理', code: 'system:dict', type: 1, parentId: 1, path: '/system/dict-type', icon: 'Notebook', sort: 4, status: 1, visible: 1 },

    // 按钮权限
    { id: 20, name: '用户查询', code: 'system:user:list', type: 2, parentId: 10, sort: 1 },
    { id: 21, name: '用户新增', code: 'system:user:create', type: 2, parentId: 10, sort: 2 },
    { id: 22, name: '用户修改', code: 'system:user:update', type: 2, parentId: 10, sort: 3 },
    { id: 23, name: '用户删除', code: 'system:user:delete', type: 2, parentId: 10, sort: 4 },

    { id: 30, name: '角色查询', code: 'system:role:list', type: 2, parentId: 11, sort: 1 },
    { id: 31, name: '角色新增', code: 'system:role:create', type: 2, parentId: 11, sort: 2 },
    { id: 32, name: '角色修改', code: 'system:role:update', type: 2, parentId: 11, sort: 3 },
    { id: 33, name: '角色删除', code: 'system:role:delete', type: 2, parentId: 11, sort: 4 },

    { id: 40, name: '菜单查询', code: 'system:permission:list', type: 2, parentId: 12, sort: 1 },
    { id: 41, name: '菜单新增', code: 'system:permission:create', type: 2, parentId: 12, sort: 2 },
    { id: 42, name: '菜单修改', code: 'system:permission:update', type: 2, parentId: 12, sort: 3 },
    { id: 43, name: '菜单删除', code: 'system:permission:delete', type: 2, parentId: 12, sort: 4 },

    { id: 50, name: '字典查询', code: 'system:dict:list', type: 2, parentId: 13, sort: 1 },
    { id: 51, name: '字典新增', code: 'system:dict:create', type: 2, parentId: 13, sort: 2 },
    { id: 52, name: '字典修改', code: 'system:dict:update', type: 2, parentId: 13, sort: 3 },
    { id: 53, name: '字典删除', code: 'system:dict:delete', type: 2, parentId: 13, sort: 4 },

    // 文件管理
    { id: 90, name: '文件管理', code: 'system:file', type: 1, parentId: 1, path: '/system/file', icon: 'FolderOpened', sort: 5, status: 1, visible: 1 },
    { id: 91, name: '文件查询', code: 'system:file:list', type: 2, parentId: 90, sort: 1 },
    { id: 92, name: '文件上传', code: 'system:file:upload', type: 2, parentId: 90, sort: 2 },
    { id: 93, name: '文件删除', code: 'system:file:delete', type: 2, parentId: 90, sort: 3 },

    // 内容管理
    { id: 60, name: '内容管理', code: 'content', type: 0, parentId: 0, path: '/content', icon: 'Document', sort: 3, status: 1, visible: 1 },
    { id: 61, name: '分类管理', code: 'content:category', type: 1, parentId: 60, path: '/content/category', icon: 'Collection', sort: 1, status: 1, visible: 1 },
    { id: 62, name: '内容列表', code: 'content:article', type: 1, parentId: 60, path: '/content/article', icon: 'DocumentCopy', sort: 2, status: 1, visible: 1 },

    // 分类按钮权限
    { id: 70, name: '分类查询', code: 'content:category:list', type: 2, parentId: 61, sort: 1 },
    { id: 71, name: '分类新增', code: 'content:category:create', type: 2, parentId: 61, sort: 2 },
    { id: 72, name: '分类修改', code: 'content:category:update', type: 2, parentId: 61, sort: 3 },
    { id: 73, name: '分类删除', code: 'content:category:delete', type: 2, parentId: 61, sort: 4 },

    // 内容按钮权限
    { id: 80, name: '内容查询', code: 'content:article:list', type: 2, parentId: 62, sort: 1 },
    { id: 81, name: '内容新增', code: 'content:article:create', type: 2, parentId: 62, sort: 2 },
    { id: 82, name: '内容修改', code: 'content:article:update', type: 2, parentId: 62, sort: 3 },
    { id: 83, name: '内容删除', code: 'content:article:delete', type: 2, parentId: 62, sort: 4 },

    // 系统监控
    { id: 100, name: '服务器监控', code: 'monitor:server', type: 1, parentId: 2, path: '/monitor/server', icon: 'Monitor', sort: 1, status: 1, visible: 1 },
    { id: 101, name: '监控查询', code: 'monitor:server:list', type: 2, parentId: 100, sort: 1 },

    // 审计日志
    { id: 110, name: '审计日志', code: 'system:audit-log', type: 1, parentId: 1, path: '/system/audit-log', icon: 'List', sort: 6, status: 1, visible: 1 },
    { id: 111, name: '日志查询', code: 'system:audit-log:list', type: 2, parentId: 110, sort: 1 },
    { id: 112, name: '日志导出', code: 'system:audit-log:export', type: 2, parentId: 110, sort: 2 },

    // 通知中心
    { id: 120, name: '通知中心', code: 'system:notification', type: 1, parentId: 1, path: '/system/notification', icon: 'BellFilled', sort: 7, status: 1, visible: 1 },
    { id: 121, name: '通知查询', code: 'system:notification:list', type: 2, parentId: 120, sort: 1 },
    { id: 122, name: '通知已读', code: 'system:notification:read', type: 2, parentId: 120, sort: 2 },
  ]

  for (const p of permissions) {
    await prisma.sysPermission.upsert({
      where: { id: p.id },
      update: { name: p.name, code: p.code, type: p.type, parentId: p.parentId, path: p.path, icon: p.icon, sort: p.sort, status: p.status, visible: p.visible ?? 1 },
      create: { ...p, visible: p.visible ?? 1 },
    })
  }

  // 2. 创建角色
  const role = await prisma.sysRole.upsert({
    where: { code: 'admin' },
    update: { name: '超级管理员', description: '系统超级管理员', status: 1, sort: 0 },
    create: { name: '超级管理员', code: 'admin', description: '系统超级管理员', status: 1, sort: 0 },
  })

  // 3. 创建用户
  const user = await prisma.sysUser.upsert({
    where: { username: 'admin' },
    update: { password: hashedPassword, nickname: '系统管理员', email: 'admin@example.com', status: 1 },
    create: { username: 'admin', password: hashedPassword, nickname: '系统管理员', email: 'admin@example.com', status: 1 },
  })

  // 4. 关联用户-角色
  await prisma.sysUserRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {},
    create: { userId: user.id, roleId: role.id },
  })

  // 5. 关联角色-权限 (所有权限给admin角色)
  const allPermIds = permissions.map(p => p.id)
  for (const permId of allPermIds) {
    await prisma.sysRolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: permId } },
      update: {},
      create: { roleId: role.id, permissionId: permId },
    })
  }

  // 6. 创建字典类型和数据
  await prisma.sysDictType.upsert({
    where: { code: 'sys_normal_disable' },
    update: { name: '系统开关', status: 1 },
    create: { name: '系统开关', code: 'sys_normal_disable', status: 1, remark: '系统开关列表' },
  })

  await prisma.sysDictType.upsert({
    where: { code: 'sys_show_hide' },
    update: { name: '显示状态', status: 1 },
    create: { name: '显示状态', code: 'sys_show_hide', status: 1, remark: '显示状态列表' },
  })

  await prisma.sysDictType.upsert({
    where: { code: 'sys_user_status' },
    update: { name: '用户状态', status: 1 },
    create: { name: '用户状态', code: 'sys_user_status', status: 1, remark: '用户状态列表' },
  })

  // 字典数据
  const dictType1 = await prisma.sysDictType.findUnique({ where: { code: 'sys_normal_disable' } })
  if (dictType1) {
    await prisma.sysDictData.upsert({
      where: { id: 1 },
      update: { dictTypeId: dictType1.id, label: '正常', value: '1', sort: 1, status: 1 },
      create: { id: 1, dictTypeId: dictType1.id, label: '正常', value: '1', sort: 1, status: 1 },
    })
    await prisma.sysDictData.upsert({
      where: { id: 2 },
      update: { dictTypeId: dictType1.id, label: '停用', value: '0', sort: 2, status: 1 },
      create: { id: 2, dictTypeId: dictType1.id, label: '停用', value: '0', sort: 2, status: 1 },
    })
  }

  console.log('✅ Seed data created successfully!')
  console.log('   Admin user: admin / admin123')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
