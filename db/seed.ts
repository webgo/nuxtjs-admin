/// <reference types="node" />
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import * as schema from './schema'

async function main() {
  const connection = await mysql.createConnection({
    user: 'root',
    password: 'root',
    database: 'admin_app',
    host: 'localhost',
    port: 3306,
  })
  const db = drizzle(connection, { schema, mode: 'default' })

  const now = new Date().toISOString().slice(0, 23).replace('T', ' ')
  const hashedPassword = await bcrypt.hash('admin123', 10)

  const permissions = [
    { id: 1, name: '系统管理', code: 'system', type: 0, parentId: 0, path: '/admin/system', icon: 'Setting', sort: 1, status: 1, visible: 1 },
    { id: 2, name: '系统监控', code: 'monitor', type: 0, parentId: 0, path: '/admin/monitor', icon: 'Monitor', sort: 2, status: 1, visible: 1 },
    { id: 10, name: '用户管理', code: 'system:user', type: 1, parentId: 1, path: '/admin/system/user', icon: 'User', sort: 1, status: 1, visible: 1 },
    { id: 11, name: '角色管理', code: 'system:role', type: 1, parentId: 1, path: '/admin/system/role', icon: 'Avatar', sort: 2, status: 1, visible: 1 },
    { id: 12, name: '菜单管理', code: 'system:permission', type: 1, parentId: 1, path: '/admin/system/permission', icon: 'Menu', sort: 3, status: 1, visible: 1 },
    { id: 13, name: '字典管理', code: 'system:dict', type: 1, parentId: 1, path: '/admin/system/dict-type', icon: 'Notebook', sort: 4, status: 1, visible: 1 },
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
    { id: 90, name: '文件管理', code: 'system:file', type: 1, parentId: 1, path: '/admin/system/file', icon: 'FolderOpened', sort: 5, status: 1, visible: 1 },
    { id: 91, name: '文件查询', code: 'system:file:list', type: 2, parentId: 90, sort: 1 },
    { id: 92, name: '文件上传', code: 'system:file:upload', type: 2, parentId: 90, sort: 2 },
    { id: 93, name: '文件删除', code: 'system:file:delete', type: 2, parentId: 90, sort: 3 },
    { id: 60, name: '内容管理', code: 'content', type: 0, parentId: 0, path: '/admin/content', icon: 'Document', sort: 3, status: 1, visible: 1 },
    { id: 61, name: '分类管理', code: 'content:category', type: 1, parentId: 60, path: '/admin/content/category', icon: 'Collection', sort: 1, status: 1, visible: 1 },
    { id: 62, name: '内容列表', code: 'content:article', type: 1, parentId: 60, path: '/admin/content/article', icon: 'DocumentCopy', sort: 2, status: 1, visible: 1 },
    { id: 70, name: '分类查询', code: 'content:category:list', type: 2, parentId: 61, sort: 1 },
    { id: 71, name: '分类新增', code: 'content:category:create', type: 2, parentId: 61, sort: 2 },
    { id: 72, name: '分类修改', code: 'content:category:update', type: 2, parentId: 61, sort: 3 },
    { id: 73, name: '分类删除', code: 'content:category:delete', type: 2, parentId: 61, sort: 4 },
    { id: 80, name: '内容查询', code: 'content:article:list', type: 2, parentId: 62, sort: 1 },
    { id: 81, name: '内容新增', code: 'content:article:create', type: 2, parentId: 62, sort: 2 },
    { id: 82, name: '内容修改', code: 'content:article:update', type: 2, parentId: 62, sort: 3 },
    { id: 83, name: '内容删除', code: 'content:article:delete', type: 2, parentId: 62, sort: 4 },
    { id: 100, name: '服务器监控', code: 'monitor:server', type: 1, parentId: 2, path: '/admin/monitor/server', icon: 'Monitor', sort: 1, status: 1, visible: 1 },
    { id: 101, name: '监控查询', code: 'monitor:server:list', type: 2, parentId: 100, sort: 1 },
    { id: 110, name: '审计日志', code: 'system:audit-log', type: 1, parentId: 1, path: '/admin/system/audit-log', icon: 'List', sort: 6, status: 1, visible: 1 },
    { id: 111, name: '日志查询', code: 'system:audit-log:list', type: 2, parentId: 110, sort: 1 },
    { id: 112, name: '日志导出', code: 'system:audit-log:export', type: 2, parentId: 110, sort: 2 },
    { id: 120, name: '通知中心', code: 'system:notification', type: 1, parentId: 1, path: '/admin/system/notification', icon: 'BellFilled', sort: 7, status: 1, visible: 1 },
    { id: 121, name: '通知查询', code: 'system:notification:list', type: 2, parentId: 120, sort: 1 },
    { id: 122, name: '通知已读', code: 'system:notification:read', type: 2, parentId: 120, sort: 2 },
    { id: 130, name: '在线用户', code: 'system:online-user', type: 1, parentId: 1, path: '/admin/system/online-user', icon: 'Avatar', sort: 8, status: 1, visible: 1 },
    { id: 131, name: '在线用户查询', code: 'system:online-user:list', type: 2, parentId: 130, sort: 1 },
    { id: 132, name: '在线用户强退', code: 'system:online-user:force-logout', type: 2, parentId: 130, sort: 2 },
    { id: 160, name: '价格单位', code: 'system:price-unit', type: 1, parentId: 1, path: '/admin/system/price-unit', icon: 'Coin', sort: 10, status: 1, visible: 1 },
    { id: 161, name: '单位查询', code: 'system:price-unit:list', type: 2, parentId: 160, sort: 1 },
    { id: 162, name: '单位新增', code: 'system:price-unit:create', type: 2, parentId: 160, sort: 2 },
    { id: 163, name: '单位修改', code: 'system:price-unit:update', type: 2, parentId: 160, sort: 3 },
    { id: 164, name: '单位删除', code: 'system:price-unit:delete', type: 2, parentId: 160, sort: 4 },
    { id: 150, name: '地区管理', code: 'system:region', type: 1, parentId: 1, path: '/admin/system/region', icon: 'MapLocation', sort: 9, status: 1, visible: 1 },
    { id: 151, name: '地区查询', code: 'system:region:list', type: 2, parentId: 150, sort: 1 },
    { id: 152, name: '地区新增', code: 'system:region:create', type: 2, parentId: 150, sort: 2 },
    { id: 153, name: '地区修改', code: 'system:region:update', type: 2, parentId: 150, sort: 3 },
    { id: 154, name: '地区删除', code: 'system:region:delete', type: 2, parentId: 150, sort: 4 },
    { id: 140, name: '缓存监控', code: 'monitor:cache', type: 1, parentId: 2, path: '/admin/monitor/cache', icon: 'Coin', sort: 2, status: 1, visible: 1 },
    { id: 141, name: '缓存查询', code: 'monitor:cache:list', type: 2, parentId: 140, sort: 1 },
    { id: 142, name: '缓存删除', code: 'monitor:cache:delete', type: 2, parentId: 140, sort: 2 },
    { id: 143, name: '缓存清空', code: 'monitor:cache:clear', type: 2, parentId: 140, sort: 3 },
    { id: 200, name: '外卖管理', code: 'eats', type: 0, parentId: 0, path: '/admin/eats', icon: 'Shop', sort: 5, status: 1, visible: 1 },
    { id: 201, name: '商家分类', code: 'eats:category:list', type: 1, parentId: 200, path: '/admin/eats/category', icon: 'Collection', sort: 1, status: 1, visible: 1 },
    { id: 202, name: '商家管理', code: 'eats:merchant:list', type: 1, parentId: 200, path: '/admin/eats/merchant', icon: 'OfficeBuilding', sort: 2, status: 1, visible: 1 },
    { id: 203, name: '商品分类', code: 'eats:product-category:list', type: 1, parentId: 200, path: '/admin/eats/product-category', icon: 'Grid', sort: 3, status: 1, visible: 1 },
    { id: 204, name: '商品管理', code: 'eats:product:list', type: 1, parentId: 200, path: '/admin/eats/product', icon: 'Goods', sort: 4, status: 1, visible: 1 },
    { id: 205, name: '订单管理', code: 'eats:order:list', type: 1, parentId: 200, path: '/admin/eats/order', icon: 'List', sort: 5, status: 1, visible: 1 },
    { id: 206, name: '评价管理', code: 'eats:rating:list', type: 1, parentId: 200, path: '/admin/eats/rating', icon: 'Star', sort: 6, status: 1, visible: 1 },
    { id: 210, name: '新增分类', code: 'eats:category:create', type: 2, parentId: 201, sort: 1 },
    { id: 211, name: '修改分类', code: 'eats:category:update', type: 2, parentId: 201, sort: 2 },
    { id: 212, name: '删除分类', code: 'eats:category:delete', type: 2, parentId: 201, sort: 3 },
    { id: 220, name: '新增商家', code: 'eats:merchant:create', type: 2, parentId: 202, sort: 1 },
    { id: 221, name: '修改商家', code: 'eats:merchant:update', type: 2, parentId: 202, sort: 2 },
    { id: 222, name: '删除商家', code: 'eats:merchant:delete', type: 2, parentId: 202, sort: 3 },
    { id: 230, name: '新增商品分类', code: 'eats:product-category:create', type: 2, parentId: 203, sort: 1 },
    { id: 231, name: '修改商品分类', code: 'eats:product-category:update', type: 2, parentId: 203, sort: 2 },
    { id: 232, name: '删除商品分类', code: 'eats:product-category:delete', type: 2, parentId: 203, sort: 3 },
    { id: 240, name: '新增商品', code: 'eats:product:create', type: 2, parentId: 204, sort: 1 },
    { id: 241, name: '修改商品', code: 'eats:product:update', type: 2, parentId: 204, sort: 2 },
    { id: 242, name: '删除商品', code: 'eats:product:delete', type: 2, parentId: 204, sort: 3 },
    { id: 250, name: '订单查询', code: 'eats:order:list', type: 2, parentId: 205, sort: 1 },
    { id: 251, name: '订单修改', code: 'eats:order:update', type: 2, parentId: 205, sort: 2 },
    { id: 252, name: '订单删除', code: 'eats:order:delete', type: 2, parentId: 205, sort: 3 },
    { id: 260, name: '评价查询', code: 'eats:rating:list', type: 2, parentId: 206, sort: 1 },
    { id: 261, name: '评价删除', code: 'eats:rating:delete', type: 2, parentId: 206, sort: 2 },
    { id: 170, name: '语言管理', code: 'system:language', type: 1, parentId: 1, path: '/admin/system/language', icon: 'ChatDotRound', sort: 11, status: 1, visible: 1 },
    { id: 171, name: '语言查询', code: 'system:language:list', type: 2, parentId: 170, sort: 1 },
    { id: 172, name: '语言新增', code: 'system:language:create', type: 2, parentId: 170, sort: 2 },
    { id: 173, name: '语言修改', code: 'system:language:update', type: 2, parentId: 170, sort: 3 },
    { id: 174, name: '语言删除', code: 'system:language:delete', type: 2, parentId: 170, sort: 4 },
    { id: 180, name: '翻译管理', code: 'system:translation', type: 1, parentId: 1, path: '/admin/system/translation', icon: 'Translation', sort: 12, status: 1, visible: 1 },
    { id: 181, name: '翻译查询', code: 'system:translation:list', type: 2, parentId: 180, sort: 1 },
    { id: 182, name: '翻译新增', code: 'system:translation:create', type: 2, parentId: 180, sort: 2 },
    { id: 183, name: '翻译修改', code: 'system:translation:update', type: 2, parentId: 180, sort: 3 },
    { id: 184, name: '翻译删除', code: 'system:translation:delete', type: 2, parentId: 180, sort: 4 },
    { id: 185, name: '翻译导出', code: 'system:translation:export', type: 2, parentId: 180, sort: 5 },
    { id: 186, name: '翻译导入', code: 'system:translation:import', type: 2, parentId: 180, sort: 6 },
  ]

  for (const p of permissions) {
    await db.insert(schema.sysPermission).values({ ...p, visible: p.visible ?? 1, updateTime: now }).onDuplicateKeyUpdate({ set: { name: p.name, code: p.code, type: p.type, parentId: p.parentId, path: p.path ?? null, icon: p.icon ?? null, sort: p.sort, status: p.status ?? 1, visible: p.visible ?? 1 } })
  }

  await db.insert(schema.sysRole).values({ name: '超级管理员', code: 'admin', description: '系统超级管理员', status: 1, sort: 0, updateTime: now }).onDuplicateKeyUpdate({ set: { name: '超级管理员', description: '系统超级管理员', status: 1, sort: 0 } })
  const [role] = await db.select().from(schema.sysRole).where(eq(schema.sysRole.code, 'admin'))

  await db.insert(schema.sysUser).values({ username: 'admin', password: hashedPassword, nickname: '系统管理员', email: 'admin@example.com', status: 1, userType: 1, updateTime: now }).onDuplicateKeyUpdate({ set: { password: hashedPassword, nickname: '系统管理员', email: 'admin@example.com', status: 1, userType: 1 } })
  const [user] = await db.select().from(schema.sysUser).where(eq(schema.sysUser.username, 'admin'))

  await db.insert(schema.sysUserRole).values({ userId: user!.id, roleId: role!.id }).onDuplicateKeyUpdate({ set: { userId: user!.id, roleId: role!.id } })

  for (const p of permissions) {
    await db.insert(schema.sysRolePermission).values({ roleId: role!.id, permissionId: p.id }).onDuplicateKeyUpdate({ set: { roleId: role!.id, permissionId: p.id } })
  }

  const dictTypes = [
    { name: '系统开关', code: 'sys_normal_disable', remark: '系统开关列表' },
    { name: '显示状态', code: 'sys_show_hide', remark: '显示状态列表' },
    { name: '用户状态', code: 'sys_user_status', remark: '用户状态列表' },
    { name: '商家标签', code: 'merchant_tag', remark: 'Eats 商家认证标签' },
  ]
  for (const dt of dictTypes) {
    await db.insert(schema.sysDictType).values({ ...dt, status: 1, updateTime: now }).onDuplicateKeyUpdate({ set: { name: dt.name, status: 1 } })
  }

  const [dictType1] = await db.select().from(schema.sysDictType).where(eq(schema.sysDictType.code, 'sys_normal_disable'))
  const [dictType3] = await db.select().from(schema.sysDictType).where(eq(schema.sysDictType.code, 'sys_user_status'))
  const [merchantTagDictType] = await db.select().from(schema.sysDictType).where(eq(schema.sysDictType.code, 'merchant_tag'))

  if (dictType1) {
    await db.insert(schema.sysDictData).values({ dictTypeId: dictType1.id, label: '正常', value: '1', sort: 1, status: 1, updateTime: now }).onDuplicateKeyUpdate({ set: { dictTypeId: dictType1.id, label: '正常', value: '1', sort: 1, status: 1 } })
    await db.insert(schema.sysDictData).values({ dictTypeId: dictType1.id, label: '停用', value: '0', sort: 2, status: 1, updateTime: now }).onDuplicateKeyUpdate({ set: { dictTypeId: dictType1.id, label: '停用', value: '0', sort: 2, status: 1 } })
  }

  if (dictType3) {
    await db.insert(schema.sysDictData).values({ dictTypeId: dictType3.id, label: '正常', value: '1', sort: 1, status: 1, cssClass: 'success', updateTime: now }).onDuplicateKeyUpdate({ set: { dictTypeId: dictType3.id, label: '正常', value: '1', sort: 1, status: 1, cssClass: 'success' } })
    await db.insert(schema.sysDictData).values({ dictTypeId: dictType3.id, label: '停用', value: '0', sort: 2, status: 1, cssClass: 'danger', updateTime: now }).onDuplicateKeyUpdate({ set: { dictTypeId: dictType3.id, label: '停用', value: '0', sort: 2, status: 1, cssClass: 'danger' } })
  }

  if (merchantTagDictType) {
    const tags = [
      { label: '品牌认证', value: 'brand', cssClass: 'success', sort: 1 },
      { label: '食安认证', value: 'food_safety', cssClass: 'primary', sort: 2 },
      { label: '极速配送', value: 'fast_delivery', cssClass: 'warning', sort: 3 },
      { label: '好评如潮', value: 'top_rated', cssClass: 'danger', sort: 4 },
    ]
    for (let i = 0; i < tags.length; i++) {
      await db.insert(schema.sysDictData).values({ dictTypeId: merchantTagDictType.id, ...tags[i], updateTime: now }).onDuplicateKeyUpdate({ set: { dictTypeId: merchantTagDictType.id, ...tags[i] } })
    }
  }

  const units = [
    { id: 1, name: '新台幣', symbol: 'NT$', sort: 1 },
    { id: 2, name: '美金', symbol: '$', sort: 2 },
    { id: 3, name: '日圓', symbol: '¥', sort: 3 },
    { id: 4, name: '歐元', symbol: '€', sort: 4 },
    { id: 5, name: '英鎊', symbol: '£', sort: 5 },
  ]
  for (const u of units) {
    await db.insert(schema.sysPriceUnit).values({ ...u, status: 1, updateTime: now }).onDuplicateKeyUpdate({ set: { name: u.name, symbol: u.symbol, sort: u.sort, status: 1 } })
  }

  const languages = [
    { name: '繁體中文', code: 'tw', isDefault: 1, sort: 1, status: 1 },
    { name: 'English', code: 'en', isDefault: 0, sort: 2, status: 1 },
    { name: '日本語', code: 'jp', isDefault: 0, sort: 3, status: 1 },
  ]
  for (const lang of languages) {
    await db.insert(schema.sysLanguage).values({ ...lang, updateTime: now }).onDuplicateKeyUpdate({ set: { name: lang.name, isDefault: lang.isDefault, sort: lang.sort, status: lang.status } })
  }

  await db.insert(schema.sysMerchantCategory).values({ name: '中式美食', code: 'chinese', icon: 'rice', sort: 1, status: 1, updateTime: now }).onDuplicateKeyUpdate({ set: { name: '中式美食', icon: 'rice', sort: 1, status: 1 } })
  await db.insert(schema.sysMerchantCategory).values({ name: '日式料理', code: 'japanese', icon: 'sushi', sort: 2, status: 1, updateTime: now }).onDuplicateKeyUpdate({ set: { name: '日式料理', icon: 'sushi', sort: 2, status: 1 } })
  await db.insert(schema.sysMerchantCategory).values({ name: '速食快餐', code: 'fast_food', icon: 'hamburger', sort: 3, status: 1, updateTime: now }).onDuplicateKeyUpdate({ set: { name: '速食快餐', icon: 'hamburger', sort: 3, status: 1 } })
  await db.insert(schema.sysMerchantCategory).values({ name: '甜點飲品', code: 'dessert', icon: 'cake', sort: 4, status: 1, updateTime: now }).onDuplicateKeyUpdate({ set: { name: '甜點飲品', icon: 'cake', sort: 4, status: 1 } })

  const [catChinese] = await db.select().from(schema.sysMerchantCategory).where(eq(schema.sysMerchantCategory.code, 'chinese'))
  const [catJapanese] = await db.select().from(schema.sysMerchantCategory).where(eq(schema.sysMerchantCategory.code, 'japanese'))
  const [catFastFood] = await db.select().from(schema.sysMerchantCategory).where(eq(schema.sysMerchantCategory.code, 'fast_food'))

  await db.insert(schema.sysRegion).values({ id: 1, name: '台灣', nameEn: 'Taiwan', nameJp: '台湾', level: 1, lang: 'tw', lng: 120.7, lat: 23.7, sort: 1, status: 1, updateTime: now }).onDuplicateKeyUpdate({ set: { name: '台灣', nameEn: 'Taiwan', nameJp: '台湾', level: 1, lang: 'tw', lng: 120.7, lat: 23.7, sort: 1, status: 1 } })
  const twCities = [
    { id: 11, name: '台北市', nameEn: 'Taipei', nameJp: '台北', lng: 121.5654, lat: 25.033, sort: 1 },
    { id: 12, name: '新北市', nameEn: 'New Taipei', nameJp: '新北', lng: 121.465, lat: 25.016, sort: 2 },
    { id: 13, name: '台中市', nameEn: 'Taichung', nameJp: '台中', lng: 120.6736, lat: 24.1477, sort: 3 },
    { id: 14, name: '台南市', nameEn: 'Tainan', nameJp: '台南', lng: 120.1888, lat: 22.9984, sort: 4 },
    { id: 15, name: '高雄市', nameEn: 'Kaohsiung', nameJp: '高雄', lng: 120.2942, lat: 22.6168, sort: 5 },
    { id: 16, name: '新竹市', nameEn: 'Hsinchu', nameJp: '新竹', lng: 120.9675, lat: 24.8067, sort: 6 },
  ]
  for (const c of twCities) {
    await db.insert(schema.sysRegion).values({ ...c, level: 3, parentId: 1, lang: 'tw', status: 1, updateTime: now }).onDuplicateKeyUpdate({ set: { ...c, level: 3, parentId: 1, lang: 'tw', status: 1 } })
  }

  await db.insert(schema.sysRegion).values({ id: 2, name: '日本', nameEn: 'Japan', nameJp: '日本', level: 1, lang: 'jp', lng: 139.6503, lat: 35.6762, sort: 2, status: 1, updateTime: now }).onDuplicateKeyUpdate({ set: { name: '日本', nameEn: 'Japan', nameJp: '日本', level: 1, lang: 'jp', lng: 139.6503, lat: 35.6762, sort: 2, status: 1 } })
  const jpCities = [
    { id: 21, name: '東京', nameEn: 'Tokyo', nameJp: '東京', lng: 139.6917, lat: 35.6895, sort: 1 },
    { id: 22, name: '大阪', nameEn: 'Osaka', nameJp: '大阪', lng: 135.5023, lat: 34.6937, sort: 2 },
  ]
  for (const c of jpCities) {
    await db.insert(schema.sysRegion).values({ ...c, level: 3, parentId: 2, lang: 'jp', status: 1, updateTime: now }).onDuplicateKeyUpdate({ set: { ...c, level: 3, parentId: 2, lang: 'jp', status: 1 } })
  }

  await db.insert(schema.sysRegion).values({ id: 3, name: '美國', nameEn: 'United States', nameJp: 'アメリカ', level: 1, lang: 'en', lng: -98.5795, lat: 39.8283, sort: 3, status: 1, updateTime: now }).onDuplicateKeyUpdate({ set: { name: '美國', nameEn: 'United States', nameJp: 'アメリカ', level: 1, lang: 'en', lng: -98.5795, lat: 39.8283, sort: 3, status: 1 } })
  await db.insert(schema.sysRegion).values({ id: 31, name: '加利福尼亞州', nameEn: 'California', nameJp: 'カリフォルニア州', level: 2, parentId: 3, lang: 'en', sort: 1, status: 1, updateTime: now }).onDuplicateKeyUpdate({ set: { name: '加利福尼亞州', nameEn: 'California', nameJp: 'カリフォルニア州', level: 2, parentId: 3, lang: 'en', sort: 1, status: 1 } })
  await db.insert(schema.sysRegion).values({ id: 32, name: '紐約州', nameEn: 'New York', nameJp: 'ニューヨーク州', level: 2, parentId: 3, lang: 'en', sort: 2, status: 1, updateTime: now }).onDuplicateKeyUpdate({ set: { name: '紐約州', nameEn: 'New York', nameJp: 'ニューヨーク州', level: 2, parentId: 3, lang: 'en', sort: 2, status: 1 } })

  const merchantData = [
    { code: 'lao_beijing', name: '老北京炸醬麵', categoryId: catChinese!.id, description: '傳承三代的老北京味道，炸醬麵遠近馳名', level: 1, deliveryFee: '3.00', minOrderAmount: '20.00', estimatedDeliveryTime: 30, openTime: '09:00', closeTime: '22:00', rating: '4.5', ratingCount: 1280, monthlySales: 856, isFeatured: 1, tags: '["brand","fast_delivery"]' },
    { code: 'sakura_sushi', name: '櫻花壽司', categoryId: catJapanese!.id, description: '嚴選當日新鮮食材，職人精神的手作壽司', level: 2, deliveryFee: '5.00', minOrderAmount: '50.00', estimatedDeliveryTime: 40, openTime: '11:00', closeTime: '21:30', rating: '4.8', ratingCount: 2560, monthlySales: 1203, isFeatured: 1, tags: '["brand","food_safety","top_rated"]' },
    { code: 'burger_king', name: '漢堡王', categoryId: catFastFood!.id, description: '火烤美味，快速供應！', level: 0, deliveryFee: '0.00', minOrderAmount: '30.00', estimatedDeliveryTime: 25, openTime: '07:00', closeTime: '23:00', rating: '4.2', ratingCount: 3200, monthlySales: 2100, isFeatured: 0, isNew: 1, tags: '["fast_delivery"]' },
  ]
  for (const m of merchantData) {
    await db.insert(schema.sysMerchant).values({ ...m, status: 1, updateTime: now }).onDuplicateKeyUpdate({ set: { name: m.name, categoryId: m.categoryId, description: m.description, level: m.level, deliveryFee: m.deliveryFee, minOrderAmount: m.minOrderAmount, estimatedDeliveryTime: m.estimatedDeliveryTime, openTime: m.openTime, closeTime: m.closeTime, rating: m.rating, ratingCount: m.ratingCount, monthlySales: m.monthlySales, isFeatured: m.isFeatured, isNew: (m as any).isNew ?? 0, tags: m.tags, status: 1 } })
  }
  const [merchant1] = await db.select().from(schema.sysMerchant).where(eq(schema.sysMerchant.code, 'lao_beijing'))
  const [merchant2] = await db.select().from(schema.sysMerchant).where(eq(schema.sysMerchant.code, 'sakura_sushi'))
  const [merchant3] = await db.select().from(schema.sysMerchant).where(eq(schema.sysMerchant.code, 'burger_king'))

  const productCategories = [
    { id: 1, name: '招牌主食', merchantId: merchant1!.id, sort: 1 },
    { id: 2, name: '小菜湯品', merchantId: merchant1!.id, sort: 2 },
    { id: 3, name: '壽司卷類', merchantId: merchant2!.id, sort: 1 },
    { id: 4, name: '刺身系列', merchantId: merchant2!.id, sort: 2 },
    { id: 5, name: '經典漢堡', merchantId: merchant3!.id, sort: 1 },
    { id: 6, name: '套餐組合', merchantId: merchant3!.id, sort: 2 },
  ]
  for (const pc of productCategories) {
    await db.insert(schema.sysProductCategory).values({ ...pc, status: 1, updateTime: now }).onDuplicateKeyUpdate({ set: { name: pc.name, merchantId: pc.merchantId, sort: pc.sort } })
  }

  const products = [
    { id: 1, name: '招牌炸醬麵', code: 'zhajiang_mian', categoryId: 1, merchantId: merchant1!.id, specs: [{ name: '小份', price: '18.00', isDefault: 1 }, { name: '大份', price: '22.00', isDefault: 0 }] },
    { id: 2, name: '北京炸醬飯', code: 'zhajiang_fan', categoryId: 1, merchantId: merchant1!.id, specs: [{ name: '標準', price: '20.00', isDefault: 1 }] },
    { id: 3, name: '老北京炸雞腿', code: 'beiing_chicken', categoryId: 1, merchantId: merchant1!.id, specs: [{ name: '單隻', price: '15.00', isDefault: 1 }, { name: '雙隻', price: '25.00', isDefault: 0 }] },
    { id: 4, name: '酸辣湯', code: 'suanla_tang', categoryId: 2, merchantId: merchant1!.id, specs: [{ name: '小碗', price: '8.00', isDefault: 1 }, { name: '大碗', price: '12.00', isDefault: 0 }] },
    { id: 5, name: '涼拌黃瓜', code: 'liangban_huanggua', categoryId: 2, merchantId: merchant1!.id, specs: [{ name: '一份', price: '10.00', isDefault: 1 }] },
    { id: 6, name: '鮭魚壽司捲', code: 'salmon_roll', categoryId: 3, merchantId: merchant2!.id, specs: [{ name: '6貫', price: '38.00', isDefault: 1 }, { name: '12貫', price: '68.00', isDefault: 0 }] },
    { id: 7, name: '加州捲', code: 'california_roll', categoryId: 3, merchantId: merchant2!.id, specs: [{ name: '8貫', price: '32.00', isDefault: 1 }] },
    { id: 8, name: '鮭魚刺身', code: 'salmon_sashimi', categoryId: 4, merchantId: merchant2!.id, specs: [{ name: '小份', price: '48.00', isDefault: 1 }, { name: '大份', price: '88.00', isDefault: 0 }] },
    { id: 9, name: '綜合刺身拼盤', code: 'mixed_sashimi', categoryId: 4, merchantId: merchant2!.id, specs: [{ name: '一份', price: '128.00', isDefault: 1 }] },
    { id: 10, name: '經典牛肉堡', code: 'classic_beef_burger', categoryId: 5, merchantId: merchant3!.id, specs: [{ name: '單層', price: '25.00', isDefault: 1 }, { name: '雙層', price: '35.00', isDefault: 0 }] },
    { id: 11, name: '雞腿堡', code: 'chicken_burger', categoryId: 5, merchantId: merchant3!.id, specs: [{ name: '一個', price: '22.00', isDefault: 1 }] },
    { id: 12, name: '牛肉堡套餐', code: 'beef_burger_set', categoryId: 6, merchantId: merchant3!.id, specs: [{ name: '標準', price: '45.00', isDefault: 1 }] },
    { id: 13, name: '雞腿堡套餐', code: 'chicken_burger_set', categoryId: 6, merchantId: merchant3!.id, specs: [{ name: '標準', price: '42.00', isDefault: 1 }] },
  ]
  for (const p of products) {
    await db.insert(schema.sysProduct).values({ id: p.id, name: p.name, code: p.code, categoryId: p.categoryId, merchantId: p.merchantId, description: '', status: 1, updateTime: now }).onDuplicateKeyUpdate({ set: { name: p.name, code: p.code, categoryId: p.categoryId, merchantId: p.merchantId, description: '', status: 1 } })
    for (let si = 0; si < p.specs.length; si++) {
      const spec = p.specs[si]
      const specId = p.id * 10 + si + 1
      await db.insert(schema.sysProductSpec).values({ id: specId, productId: p.id, name: spec.name, price: spec.price, isDefault: spec.isDefault, sort: si, status: 1, updateTime: now }).onDuplicateKeyUpdate({ set: { productId: p.id, name: spec.name, price: spec.price, isDefault: spec.isDefault, sort: si, status: 1 } })
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
