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
    { id: 1, name: '系统管理', code: 'system', type: 0, parentId: 0, path: '/admin/system', icon: 'Setting', sort: 1, status: 1, visible: 1 },
    { id: 2, name: '系统监控', code: 'monitor', type: 0, parentId: 0, path: '/admin/monitor', icon: 'Monitor', sort: 2, status: 1, visible: 1 },

    // 系统管理 -> 子菜单
    { id: 10, name: '用户管理', code: 'system:user', type: 1, parentId: 1, path: '/admin/system/user', icon: 'User', sort: 1, status: 1, visible: 1 },
    { id: 11, name: '角色管理', code: 'system:role', type: 1, parentId: 1, path: '/admin/system/role', icon: 'Avatar', sort: 2, status: 1, visible: 1 },
    { id: 12, name: '菜单管理', code: 'system:permission', type: 1, parentId: 1, path: '/admin/system/permission', icon: 'Menu', sort: 3, status: 1, visible: 1 },
    { id: 13, name: '字典管理', code: 'system:dict', type: 1, parentId: 1, path: '/admin/system/dict-type', icon: 'Notebook', sort: 4, status: 1, visible: 1 },

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
    { id: 90, name: '文件管理', code: 'system:file', type: 1, parentId: 1, path: '/admin/system/file', icon: 'FolderOpened', sort: 5, status: 1, visible: 1 },
    { id: 91, name: '文件查询', code: 'system:file:list', type: 2, parentId: 90, sort: 1 },
    { id: 92, name: '文件上传', code: 'system:file:upload', type: 2, parentId: 90, sort: 2 },
    { id: 93, name: '文件删除', code: 'system:file:delete', type: 2, parentId: 90, sort: 3 },

    // 内容管理
    { id: 60, name: '内容管理', code: 'content', type: 0, parentId: 0, path: '/admin/content', icon: 'Document', sort: 3, status: 1, visible: 1 },
    { id: 61, name: '分类管理', code: 'content:category', type: 1, parentId: 60, path: '/admin/content/category', icon: 'Collection', sort: 1, status: 1, visible: 1 },
    { id: 62, name: '内容列表', code: 'content:article', type: 1, parentId: 60, path: '/admin/content/article', icon: 'DocumentCopy', sort: 2, status: 1, visible: 1 },

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
    { id: 100, name: '服务器监控', code: 'monitor:server', type: 1, parentId: 2, path: '/admin/monitor/server', icon: 'Monitor', sort: 1, status: 1, visible: 1 },
    { id: 101, name: '监控查询', code: 'monitor:server:list', type: 2, parentId: 100, sort: 1 },

    // 审计日志
    { id: 110, name: '审计日志', code: 'system:audit-log', type: 1, parentId: 1, path: '/admin/system/audit-log', icon: 'List', sort: 6, status: 1, visible: 1 },
    { id: 111, name: '日志查询', code: 'system:audit-log:list', type: 2, parentId: 110, sort: 1 },
    { id: 112, name: '日志导出', code: 'system:audit-log:export', type: 2, parentId: 110, sort: 2 },

    // 通知中心
    { id: 120, name: '通知中心', code: 'system:notification', type: 1, parentId: 1, path: '/admin/system/notification', icon: 'BellFilled', sort: 7, status: 1, visible: 1 },
    { id: 121, name: '通知查询', code: 'system:notification:list', type: 2, parentId: 120, sort: 1 },
    { id: 122, name: '通知已读', code: 'system:notification:read', type: 2, parentId: 120, sort: 2 },

    // 在线用户
    { id: 130, name: '在线用户', code: 'system:online-user', type: 1, parentId: 1, path: '/admin/system/online-user', icon: 'Avatar', sort: 8, status: 1, visible: 1 },
    { id: 131, name: '在线用户查询', code: 'system:online-user:list', type: 2, parentId: 130, sort: 1 },
    { id: 132, name: '在线用户强退', code: 'system:online-user:force-logout', type: 2, parentId: 130, sort: 2 },

    // 价格单位管理
    { id: 160, name: '价格单位', code: 'system:price-unit', type: 1, parentId: 1, path: '/admin/system/price-unit', icon: 'Coin', sort: 10, status: 1, visible: 1 },
    { id: 161, name: '单位查询', code: 'system:price-unit:list', type: 2, parentId: 160, sort: 1 },
    { id: 162, name: '单位新增', code: 'system:price-unit:create', type: 2, parentId: 160, sort: 2 },
    { id: 163, name: '单位修改', code: 'system:price-unit:update', type: 2, parentId: 160, sort: 3 },
    { id: 164, name: '单位删除', code: 'system:price-unit:delete', type: 2, parentId: 160, sort: 4 },

    // 地区管理
    { id: 150, name: '地区管理', code: 'system:region', type: 1, parentId: 1, path: '/admin/system/region', icon: 'MapLocation', sort: 9, status: 1, visible: 1 },
    { id: 151, name: '地区查询', code: 'system:region:list', type: 2, parentId: 150, sort: 1 },
    { id: 152, name: '地区新增', code: 'system:region:create', type: 2, parentId: 150, sort: 2 },
    { id: 153, name: '地区修改', code: 'system:region:update', type: 2, parentId: 150, sort: 3 },
    { id: 154, name: '地区删除', code: 'system:region:delete', type: 2, parentId: 150, sort: 4 },

    // 缓存监控 (系统监控下)
    { id: 140, name: '缓存监控', code: 'monitor:cache', type: 1, parentId: 2, path: '/admin/monitor/cache', icon: 'Coin', sort: 2, status: 1, visible: 1 },
    { id: 141, name: '缓存查询', code: 'monitor:cache:list', type: 2, parentId: 140, sort: 1 },
    { id: 142, name: '缓存删除', code: 'monitor:cache:delete', type: 2, parentId: 140, sort: 2 },
    { id: 143, name: '缓存清空', code: 'monitor:cache:clear', type: 2, parentId: 140, sort: 3 },

    // 外卖管理
    { id: 200, name: '外卖管理', code: 'eats', type: 0, parentId: 0, path: '/admin/eats', icon: 'Shop', sort: 5, status: 1, visible: 1 },
    { id: 201, name: '商家分类', code: 'eats:category:list', type: 1, parentId: 200, path: '/admin/eats/category', icon: 'Collection', sort: 1, status: 1, visible: 1 },
    { id: 202, name: '商家管理', code: 'eats:merchant:list', type: 1, parentId: 200, path: '/admin/eats/merchant', icon: 'OfficeBuilding', sort: 2, status: 1, visible: 1 },
    { id: 203, name: '商品分类', code: 'eats:product-category:list', type: 1, parentId: 200, path: '/admin/eats/product-category', icon: 'Grid', sort: 3, status: 1, visible: 1 },
    { id: 204, name: '商品管理', code: 'eats:product:list', type: 1, parentId: 200, path: '/admin/eats/product', icon: 'Goods', sort: 4, status: 1, visible: 1 },
    { id: 205, name: '订单管理', code: 'eats:order:list', type: 1, parentId: 200, path: '/admin/eats/order', icon: 'List', sort: 5, status: 1, visible: 1 },
    { id: 206, name: '评价管理', code: 'eats:rating:list', type: 1, parentId: 200, path: '/admin/eats/rating', icon: 'Star', sort: 6, status: 1, visible: 1 },

    // 商家分类按钮
    { id: 210, name: '新增分类', code: 'eats:category:create', type: 2, parentId: 201, sort: 1 },
    { id: 211, name: '修改分类', code: 'eats:category:update', type: 2, parentId: 201, sort: 2 },
    { id: 212, name: '删除分类', code: 'eats:category:delete', type: 2, parentId: 201, sort: 3 },

    // 商家按钮
    { id: 220, name: '新增商家', code: 'eats:merchant:create', type: 2, parentId: 202, sort: 1 },
    { id: 221, name: '修改商家', code: 'eats:merchant:update', type: 2, parentId: 202, sort: 2 },
    { id: 222, name: '删除商家', code: 'eats:merchant:delete', type: 2, parentId: 202, sort: 3 },

    // 商品分类按钮
    { id: 230, name: '新增商品分类', code: 'eats:product-category:create', type: 2, parentId: 203, sort: 1 },
    { id: 231, name: '修改商品分类', code: 'eats:product-category:update', type: 2, parentId: 203, sort: 2 },
    { id: 232, name: '删除商品分类', code: 'eats:product-category:delete', type: 2, parentId: 203, sort: 3 },

    // 商品按钮
    { id: 240, name: '新增商品', code: 'eats:product:create', type: 2, parentId: 204, sort: 1 },
    { id: 241, name: '修改商品', code: 'eats:product:update', type: 2, parentId: 204, sort: 2 },
    { id: 242, name: '删除商品', code: 'eats:product:delete', type: 2, parentId: 204, sort: 3 },

    // 订单按钮
    { id: 250, name: '订单查询', code: 'eats:order:list', type: 2, parentId: 205, sort: 1 },
    { id: 251, name: '订单修改', code: 'eats:order:update', type: 2, parentId: 205, sort: 2 },
    { id: 252, name: '订单删除', code: 'eats:order:delete', type: 2, parentId: 205, sort: 3 },

    // 评价按钮
    { id: 260, name: '评价查询', code: 'eats:rating:list', type: 2, parentId: 206, sort: 1 },
    { id: 261, name: '评价删除', code: 'eats:rating:delete', type: 2, parentId: 206, sort: 2 },
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

  // 用户状态字典数据
  const dictType3 = await prisma.sysDictType.findUnique({ where: { code: 'sys_user_status' } })
  if (dictType3) {
    await prisma.sysDictData.upsert({
      where: { id: 3 },
      update: { dictTypeId: dictType3.id, label: '正常', value: '1', sort: 1, status: 1, cssClass: 'success' },
      create: { id: 3, dictTypeId: dictType3.id, label: '正常', value: '1', sort: 1, status: 1, cssClass: 'success' },
    })
    await prisma.sysDictData.upsert({
      where: { id: 4 },
      update: { dictTypeId: dictType3.id, label: '停用', value: '0', sort: 2, status: 1, cssClass: 'danger' },
      create: { id: 4, dictTypeId: dictType3.id, label: '停用', value: '0', sort: 2, status: 1, cssClass: 'danger' },
    })
  }

  // 7. 创建价格单位
  const units = [
    { id: 1, name: '新台幣', symbol: 'NT$', sort: 1 },
    { id: 2, name: '美金', symbol: '$', sort: 2 },
    { id: 3, name: '日圓', symbol: '¥', sort: 3 },
    { id: 4, name: '歐元', symbol: '€', sort: 4 },
    { id: 5, name: '英鎊', symbol: '£', sort: 5 },
  ]
  for (const u of units) {
    await prisma.sysPriceUnit.upsert({
      where: { id: u.id },
      update: { name: u.name, symbol: u.symbol, sort: u.sort, status: 1 },
      create: { id: u.id, name: u.name, symbol: u.symbol, sort: u.sort, status: 1 },
    })
  }

  // 8. 创建商家标签字典（merchant_tag）
  await prisma.sysDictType.upsert({
    where: { code: 'merchant_tag' },
    update: { name: '商家标签', status: 1 },
    create: { name: '商家标签', code: 'merchant_tag', status: 1, remark: 'Eats 商家认证标签' },
  })

  const merchantTagDictType = await prisma.sysDictType.findUnique({ where: { code: 'merchant_tag' } })
  if (merchantTagDictType) {
    const tags = [
      { label: '品牌认证', value: 'brand', cssClass: 'success', sort: 1 },
      { label: '食安认证', value: 'food_safety', cssClass: 'primary', sort: 2 },
      { label: '极速配送', value: 'fast_delivery', cssClass: 'warning', sort: 3 },
      { label: '好评如潮', value: 'top_rated', cssClass: 'danger', sort: 4 },
    ]
    for (let i = 0; i < tags.length; i++) {
      await prisma.sysDictData.upsert({
        where: { id: 100 + i }, // 从 100 开始避免 id 冲突
        update: { dictTypeId: merchantTagDictType.id, ...tags[i] },
        create: { id: 100 + i, dictTypeId: merchantTagDictType.id, ...tags[i] },
      })
    }
  }

  // 8. 创建示例商家分类
  const catChinese = await prisma.sysMerchantCategory.upsert({
    where: { code: 'chinese' },
    update: { name: '中式美食', icon: 'rice', sort: 1, status: 1 },
    create: { name: '中式美食', code: 'chinese', icon: 'rice', sort: 1, status: 1 },
  })
  const catJapanese = await prisma.sysMerchantCategory.upsert({
    where: { code: 'japanese' },
    update: { name: '日式料理', icon: 'sushi', sort: 2, status: 1 },
    create: { name: '日式料理', code: 'japanese', icon: 'sushi', sort: 2, status: 1 },
  })
  const catFastFood = await prisma.sysMerchantCategory.upsert({
    where: { code: 'fast_food' },
    update: { name: '速食快餐', icon: 'hamburger', sort: 3, status: 1 },
    create: { name: '速食快餐', code: 'fast_food', icon: 'hamburger', sort: 3, status: 1 },
  })
  const catDessert = await prisma.sysMerchantCategory.upsert({
    where: { code: 'dessert' },
    update: { name: '甜點飲品', icon: 'cake', sort: 4, status: 1 },
    create: { name: '甜點飲品', code: 'dessert', icon: 'cake', sort: 4, status: 1 },
  })

  // 9. 创建地区数据（国家-省份-城市）
  // 台湾（关联 tw 语言包）
  const tw = await prisma.sysRegion.upsert({
    where: { id: 1 },
    update: { name: '台灣', nameEn: 'Taiwan', nameJp: '台湾', level: 1, lang: 'tw', lng: 120.7, lat: 23.7, sort: 1, status: 1 },
    create: { id: 1, name: '台灣', nameEn: 'Taiwan', nameJp: '台湾', level: 1, lang: 'tw', lng: 120.7, lat: 23.7, sort: 1, status: 1 },
  })
  const twCities = [
    { id: 11, name: '台北市', nameEn: 'Taipei', nameJp: '台北', lng: 121.5654, lat: 25.033, sort: 1 },
    { id: 12, name: '新北市', nameEn: 'New Taipei', nameJp: '新北', lng: 121.465, lat: 25.016, sort: 2 },
    { id: 13, name: '台中市', nameEn: 'Taichung', nameJp: '台中', lng: 120.6736, lat: 24.1477, sort: 3 },
    { id: 14, name: '台南市', nameEn: 'Tainan', nameJp: '台南', lng: 120.1888, lat: 22.9984, sort: 4 },
    { id: 15, name: '高雄市', nameEn: 'Kaohsiung', nameJp: '高雄', lng: 120.2942, lat: 22.6168, sort: 5 },
    { id: 16, name: '新竹市', nameEn: 'Hsinchu', nameJp: '新竹', lng: 120.9675, lat: 24.8067, sort: 6 },
  ]
  for (const c of twCities) {
    await prisma.sysRegion.upsert({
      where: { id: c.id },
      update: { ...c, level: 3, parentId: tw.id, lang: 'tw', status: 1 },
      create: { ...c, level: 3, parentId: tw.id, lang: 'tw', status: 1 },
    })
  }

  // 日本（关联 jp 语言包）
  const jp = await prisma.sysRegion.upsert({
    where: { id: 2 },
    update: { name: '日本', nameEn: 'Japan', nameJp: '日本', level: 1, lang: 'jp', lng: 139.6503, lat: 35.6762, sort: 2, status: 1 },
    create: { id: 2, name: '日本', nameEn: 'Japan', nameJp: '日本', level: 1, lang: 'jp', lng: 139.6503, lat: 35.6762, sort: 2, status: 1 },
  })
  const jpCities = [
    { id: 21, name: '東京', nameEn: 'Tokyo', nameJp: '東京', lng: 139.6917, lat: 35.6895, sort: 1 },
    { id: 22, name: '大阪', nameEn: 'Osaka', nameJp: '大阪', lng: 135.5023, lat: 34.6937, sort: 2 },
  ]
  for (const c of jpCities) {
    await prisma.sysRegion.upsert({
      where: { id: c.id },
      update: { ...c, level: 3, parentId: jp.id, lang: 'jp', status: 1 },
      create: { ...c, level: 3, parentId: jp.id, lang: 'jp', status: 1 },
    })
  }

  // 美国（关联 en 语言包）
  const us = await prisma.sysRegion.upsert({
    where: { id: 3 },
    update: { name: '美國', nameEn: 'United States', nameJp: 'アメリカ', level: 1, lang: 'en', lng: -98.5795, lat: 39.8283, sort: 3, status: 1 },
    create: { id: 3, name: '美國', nameEn: 'United States', nameJp: 'アメリカ', level: 1, lang: 'en', lng: -98.5795, lat: 39.8283, sort: 3, status: 1 },
  })
  const ca = await prisma.sysRegion.upsert({
    where: { id: 31 },
    update: { name: '加利福尼亞州', nameEn: 'California', nameJp: 'カリフォルニア州', level: 2, parentId: us.id, lang: 'en', sort: 1, status: 1 },
    create: { id: 31, name: '加利福尼亞州', nameEn: 'California', nameJp: 'カリフォルニア州', level: 2, parentId: us.id, lang: 'en', sort: 1, status: 1 },
  })
  const ny = await prisma.sysRegion.upsert({
    where: { id: 32 },
    update: { name: '紐約州', nameEn: 'New York', nameJp: 'ニューヨーク州', level: 2, parentId: us.id, lang: 'en', sort: 2, status: 1 },
    create: { id: 32, name: '紐約州', nameEn: 'New York', nameJp: 'ニューヨーク州', level: 2, parentId: us.id, lang: 'en', sort: 2, status: 1 },
  })
  const usCities = [
    { id: 41, name: '洛杉磯', nameEn: 'Los Angeles', nameJp: 'ロサンゼルス', lng: -118.2437, lat: 34.0522, parentId: ca.id, sort: 1 },
    { id: 42, name: '舊金山', nameEn: 'San Francisco', nameJp: 'サンフランシスコ', lng: -122.4194, lat: 37.7749, parentId: ca.id, sort: 2 },
    { id: 43, name: '紐約市', nameEn: 'New York City', nameJp: 'ニューヨーク市', lng: -74.006, lat: 40.7128, parentId: ny.id, sort: 1 },
  ]
  for (const c of usCities) {
    await prisma.sysRegion.upsert({
      where: { id: c.id },
      update: { ...c, level: 3, lang: 'en', status: 1 },
      create: { ...c, level: 3, lang: 'en', status: 1 },
    })
  }

  // 10. 创建示例商家
  const merchant1 = await prisma.sysMerchant.upsert({
    where: { code: 'lao_beijing' },
    update: {
      name: '老北京炸醬麵', categoryId: catChinese.id, level: 1,
      deliveryFee: 3.0, minOrderAmount: 20.0, estimatedDeliveryTime: 30,
      openTime: '09:00', closeTime: '22:00',
      rating: 4.5, ratingCount: 1280, monthlySales: 856,
      isFeatured: 1, isNew: 0, tags: '["brand","fast_delivery"]',
      status: 1,
    },
    create: {
      name: '老北京炸醬麵', code: 'lao_beijing', categoryId: catChinese.id,
      description: '傳承三代的老北京味道，炸醬麵遠近馳名', level: 1,
      deliveryFee: 3.0, minOrderAmount: 20.0, estimatedDeliveryTime: 30,
      openTime: '09:00', closeTime: '22:00',
      rating: 4.5, ratingCount: 1280, monthlySales: 856,
      isFeatured: 1, isNew: 0, tags: '["brand","fast_delivery"]',
      status: 1,
    },
  })

  const merchant2 = await prisma.sysMerchant.upsert({
    where: { code: 'sakura_sushi' },
    update: {
      name: '櫻花壽司', categoryId: catJapanese.id, level: 2,
      deliveryFee: 5.0, minOrderAmount: 50.0, estimatedDeliveryTime: 40,
      openTime: '11:00', closeTime: '21:30',
      rating: 4.8, ratingCount: 2560, monthlySales: 1203,
      isFeatured: 1, isNew: 0, tags: '["brand","food_safety","top_rated"]',
      status: 1,
    },
    create: {
      name: '櫻花壽司', code: 'sakura_sushi', categoryId: catJapanese.id,
      description: '嚴選當日新鮮食材，職人精神的手作壽司', level: 2,
      deliveryFee: 5.0, minOrderAmount: 50.0, estimatedDeliveryTime: 40,
      openTime: '11:00', closeTime: '21:30',
      rating: 4.8, ratingCount: 2560, monthlySales: 1203,
      isFeatured: 1, isNew: 0, tags: '["brand","food_safety","top_rated"]',
      status: 1,
    },
  })

  const merchant3 = await prisma.sysMerchant.upsert({
    where: { code: 'burger_king' },
    update: {
      name: '漢堡王', categoryId: catFastFood.id, level: 0,
      deliveryFee: 0.0, minOrderAmount: 30.0, estimatedDeliveryTime: 25,
      openTime: '07:00', closeTime: '23:00',
      rating: 4.2, ratingCount: 3200, monthlySales: 2100,
      isFeatured: 0, isNew: 1, tags: '["fast_delivery"]',
      status: 1,
    },
    create: {
      name: '漢堡王', code: 'burger_king', categoryId: catFastFood.id,
      description: '火烤美味，快速供應！', level: 0,
      deliveryFee: 0.0, minOrderAmount: 30.0, estimatedDeliveryTime: 25,
      openTime: '07:00', closeTime: '23:00',
      rating: 4.2, ratingCount: 3200, monthlySales: 2100,
      isFeatured: 0, isNew: 1, tags: '["fast_delivery"]',
      status: 1,
    },
  })

  // 10. 创建商品分类（商家内部菜单分类）
  // 老北京
  const pc1 = await prisma.sysProductCategory.upsert({
    where: { id: 1 },
    update: { name: '招牌主食', merchantId: merchant1.id, sort: 1 },
    create: { id: 1, name: '招牌主食', merchantId: merchant1.id, sort: 1 },
  })
  const pc2 = await prisma.sysProductCategory.upsert({
    where: { id: 2 },
    update: { name: '小菜湯品', merchantId: merchant1.id, sort: 2 },
    create: { id: 2, name: '小菜湯品', merchantId: merchant1.id, sort: 2 },
  })
  // 樱花寿司
  const pc3 = await prisma.sysProductCategory.upsert({
    where: { id: 3 },
    update: { name: '壽司卷類', merchantId: merchant2.id, sort: 1 },
    create: { id: 3, name: '壽司卷類', merchantId: merchant2.id, sort: 1 },
  })
  const pc4 = await prisma.sysProductCategory.upsert({
    where: { id: 4 },
    update: { name: '刺身系列', merchantId: merchant2.id, sort: 2 },
    create: { id: 4, name: '刺身系列', merchantId: merchant2.id, sort: 2 },
  })
  // 汉堡王
  const pc5 = await prisma.sysProductCategory.upsert({
    where: { id: 5 },
    update: { name: '經典漢堡', merchantId: merchant3.id, sort: 1 },
    create: { id: 5, name: '經典漢堡', merchantId: merchant3.id, sort: 1 },
  })
  const pc6 = await prisma.sysProductCategory.upsert({
    where: { id: 6 },
    update: { name: '套餐組合', merchantId: merchant3.id, sort: 2 },
    create: { id: 6, name: '套餐組合', merchantId: merchant3.id, sort: 2 },
  })

  // 11. 创建商品
  const products = [
    // 老北京 — 招牌主食
    { id: 1, name: '招牌炸醬麵', code: 'zhajiang_mian', categoryId: pc1.id, merchantId: merchant1.id, unit: '碗', specs: [{ name: '小份', price: 18.0, isDefault: 1 }, { name: '大份', price: 22.0 }] },
    { id: 2, name: '北京炸醬飯', code: 'zhajiang_fan', categoryId: pc1.id, merchantId: merchant1.id, unit: '份', specs: [{ name: '標準', price: 20.0, isDefault: 1 }] },
    { id: 3, name: '老北京炸雞腿', code: 'beiing_chicken', categoryId: pc1.id, merchantId: merchant1.id, unit: '隻', specs: [{ name: '單隻', price: 15.0, isDefault: 1 }, { name: '雙隻', price: 25.0 }] },
    // 老北京 — 小菜汤品
    { id: 4, name: '酸辣湯', code: 'suanla_tang', categoryId: pc2.id, merchantId: merchant1.id, unit: '碗', specs: [{ name: '小碗', price: 8.0, isDefault: 1 }, { name: '大碗', price: 12.0 }] },
    { id: 5, name: '涼拌黃瓜', code: 'liangban_huanggua', categoryId: pc2.id, merchantId: merchant1.id, unit: '份', specs: [{ name: '一份', price: 10.0, isDefault: 1 }] },
    // 樱花寿司 — 寿司卷类
    { id: 6, name: '鮭魚壽司捲', code: 'salmon_roll', categoryId: pc3.id, merchantId: merchant2.id, unit: '份', specs: [{ name: '6貫', price: 38.0, isDefault: 1 }, { name: '12貫', price: 68.0 }] },
    { id: 7, name: '加州捲', code: 'california_roll', categoryId: pc3.id, merchantId: merchant2.id, unit: '份', specs: [{ name: '8貫', price: 32.0, isDefault: 1 }] },
    // 樱花寿司 — 刺身系列
    { id: 8, name: '鮭魚刺身', code: 'salmon_sashimi', categoryId: pc4.id, merchantId: merchant2.id, unit: '份', specs: [{ name: '小份', price: 48.0, isDefault: 1 }, { name: '大份', price: 88.0 }] },
    { id: 9, name: '綜合刺身拼盤', code: 'mixed_sashimi', categoryId: pc4.id, merchantId: merchant2.id, unit: '份', specs: [{ name: '一份', price: 128.0, isDefault: 1 }] },
    // 汉堡王 — 经典汉堡
    { id: 10, name: '經典牛肉堡', code: 'classic_beef_burger', categoryId: pc5.id, merchantId: merchant3.id, unit: '個', specs: [{ name: '單層', price: 25.0, isDefault: 1 }, { name: '雙層', price: 35.0 }] },
    { id: 11, name: '雞腿堡', code: 'chicken_burger', categoryId: pc5.id, merchantId: merchant3.id, unit: '個', specs: [{ name: '一個', price: 22.0, isDefault: 1 }] },
    // 汉堡王 — 套餐组合
    { id: 12, name: '牛肉堡套餐', code: 'beef_burger_set', categoryId: pc6.id, merchantId: merchant3.id, unit: '份', specs: [{ name: '標準', price: 45.0, isDefault: 1 }] },
    { id: 13, name: '雞腿堡套餐', code: 'chicken_burger_set', categoryId: pc6.id, merchantId: merchant3.id, unit: '份', specs: [{ name: '標準', price: 42.0, isDefault: 1 }] },
  ]

  for (const p of products) {
    const { specs, ...productData } = p
    await prisma.sysProduct.upsert({
      where: { id: productData.id },
      update: { ...productData, description: '' },
      create: { ...productData, description: '' },
    })
    // 创建/更新规格
    for (let si = 0; si < specs.length; si++) {
      const spec = specs[si]
      const specId = productData.id * 10 + si + 1
      await prisma.sysProductSpec.upsert({
        where: { id: specId },
        update: {
          productId: productData.id, name: spec.name,
          price: spec.price, isDefault: spec.isDefault ?? 0, sort: si, status: 1,
        },
        create: {
          id: specId, productId: productData.id, name: spec.name,
          price: spec.price, isDefault: spec.isDefault ?? 0, sort: si, status: 1,
        },
      })
    }
  }

  console.log('✅ Seed data created successfully!')
  console.log('   Admin user: admin / admin123')
  console.log('   Eats demo merchants: 老北京炸醬麵, 櫻花壽司, 漢堡王')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
