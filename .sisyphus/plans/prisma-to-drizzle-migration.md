# Prisma → Drizzle ORM 完整迁移计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将整个项目的 ORM 从 Prisma 7 完整迁移到 Drizzle ORM，实现 SQL-like 查询风格，消除 Decimal Number() 转换，提升 AI 辅助开发效率。

**Architecture:** 采用增量迁移策略：先建立 Drizzle 基础设施，再按服务复杂度从低到高逐步迁移，最后清理 Prisma 残留。整个迁移期间 Prisma 和 Drizzle 可以共存（两者独立连接同一 MySQL 数据库），确保每步可回滚。

**Tech Stack:** Drizzle ORM + mysql2 + drizzle-kit, TypeScript strict mode, Nuxt 4 / Nitro

---

## 关键设计决策

### 迁移策略：增量替换（非一次性重写）

- **Phase 0**: 建立 Drizzle 基础设施，Prisma 保持不变
- **Phase 1-3**: 按复杂度从低到高逐个迁移服务（每个服务独立可验证）
- **Phase 4**: 迁移 Portal API 直接调用（抽取到 service 层）
- **Phase 5**: 清理 Prisma 残留（移除 schema、prisma.ts、旧 pagination）

### 分页工具：双版本共存

`pagination.ts` 当前返回 `{ skip, take }`（Prisma 专属）。迁移期间创建 `drizzle-pagination.ts` 返回 `{ offset, limit }`，全部服务迁移完毕后删除旧版。

### Schema 策略：从现有 DB 拉取

使用 `drizzle-kit pull` 从运行中的 MySQL 数据库生成 Drizzle schema，确保与现有表结构完全一致，而非手动从 Prisma schema 翻译（减少出错风险）。

---

## Phase 0 — 基础设施搭建

### Task 0.1: 安装 Drizzle 依赖

**Files:**
- Modify: `package.json`

**Steps:**

1. 安装 Drizzle ORM 和 mysql2 驱动：
```bash
npm install drizzle-orm mysql2
npm install -D drizzle-kit
```

2. 验证安装成功：
```bash
npx drizzle-kit --version
```

3. Commit:
```bash
git add package.json package-lock.json
git commit -m "chore: add drizzle-orm and mysql2 dependencies"
```

---

### Task 0.2: 创建 Drizzle 数据库连接

**Files:**
- Create: `server/utils/db.ts`

**Step 1: 创建 db.ts**

```typescript
import mysql from 'mysql2/promise'
import { drizzle } from 'drizzle-orm/mysql2'
import * as schema from '../../db/schema'

let db: ReturnType<typeof drizzle<typeof schema>>

export function getDb() {
  if (!db) {
    const url = process.env.DATABASE_URL || 'mysql://root:root@localhost:3306/admin_app'
    const parsedUrl = new URL(url)

    const pool = mysql.createPool({
      host: parsedUrl.hostname,
      port: Number(parsedUrl.port) || 3306,
      user: parsedUrl.username,
      password: parsedUrl.password,
      database: parsedUrl.pathname.replace('/', ''),
      connectionLimit: 20,
      waitForConnections: true,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    })

    db = drizzle(pool, { schema, mode: 'default' })
  }
  return db
}

export default getDb()
```

**Step 2: 验证** — 此时 `db/schema` 还不存在，先创建空的占位文件让 TypeScript 不报错：

Create `db/schema.ts`:
```typescript
// Drizzle schema definitions will be generated here
// Run: npx drizzle-kit pull to generate from existing database
export {}
```

Create `drizzle.config.ts`:
```typescript
import type { Config } from 'drizzle-kit'

export default {
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'mysql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'mysql://root:root@localhost:3306/admin_app',
  },
} satisfies Config
```

**Step 3: Commit**
```bash
git add server/utils/db.ts db/schema.ts drizzle.config.ts
git commit -m "feat: add drizzle-orm database connection and config"
```

---

### Task 0.3: 从现有数据库生成 Drizzle Schema

**Prerequisites:** MySQL 数据库必须正在运行且包含现有表结构。

**Steps:**

1. 从现有 DB 拉取 schema（自动生成 27 个表定义）：
```bash
npx drizzle-kit pull
```

2. 生成的 `db/schema.ts` 会包含所有表的 TypeScript 定义。验证关键表是否存在：
   - `sys_user`, `sys_role`, `sys_permission`
   - `sys_merchant`, `sys_product`, `sys_product_spec`
   - `sys_order`, `sys_order_item`
   - `sys_cart`, `sys_rating`
   - `sys_language`, `sys_translation`

3. 为每个表导出 type inference（如果 pull 没有自动生成，在 schema 文件顶部添加）：
```typescript
// 在 schema 文件中，确保每个表都可以推断类型
// 例如：type SelectUser = typeof sysUser.$inferSelect
```

4. 生成初始迁移文件验证 schema 正确性：
```bash
npx drizzle-kit generate
```
检查生成的 SQL 应该是空的（因为表已存在）。

5. Commit:
```bash
git add db/
git commit -m "feat: generate drizzle schema from existing database"
```

---

### Task 0.4: 创建 Drizzle 分页工具

**Files:**
- Create: `server/utils/drizzle-pagination.ts`

**Step 1: 创建新的分页工具**

```typescript
export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginationQuery {
  page?: string | string[]
  pageSize?: string | string[]
}

export function parsePagination(query: PaginationQuery): PaginationParams {
  const page = Math.max(1, Number(query.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 10))
  return { page, pageSize }
}

export function paginateOffset(params: PaginationParams): { offset: number; limit: number } {
  return {
    offset: (params.page - 1) * params.pageSize,
    limit: params.pageSize,
  }
}
```

**Step 2: Commit**
```bash
git add server/utils/drizzle-pagination.ts
git commit -m "feat: add drizzle pagination utility with offset/limit"
```

---

### Task 0.5: 验证基础设施可用

**Steps:**

1. 运行类型检查确认无新增错误：
```bash
npx nuxi typecheck
```

2. 确认 Prisma 仍然正常工作（此时所有 service 还在用 Prisma）：
```bash
npm run dev
# 访问几个页面确认功能正常
```

3. Commit（如果需要修复）:
```bash
git commit -m "fix: resolve typecheck issues after drizzle setup"
```

---

## Phase 1 — 简单独立服务迁移（无关系查询）

这些服务只有基础 CRUD，不涉及 include/join，是最安全的练手目标。

### Task 1.1: 迁移 price-unit.service.ts

**Files:**
- Modify: `server/services/price-unit.service.ts`
- Read: `db/schema.ts` (查看 sysPriceUnit 表定义)

**迁移模式（适用于所有简单服务）：**

```typescript
// BEFORE (Prisma):
import prisma from '../utils/prisma'
// prisma.sysPriceUnit.findMany({ where, skip, take, orderBy: [{ sort: 'asc' }] })

// AFTER (Drizzle):
import db from '../utils/db'
import { sysPriceUnit } from '../../db/schema'
import { eq, like, asc, sql } from 'drizzle-orm'
import { parsePagination, paginateOffset } from '../utils/drizzle-pagination'

// findMany → db.select().from().where().orderBy().offset().limit()
// count → db.select({ count: count() }).from().where()
// create → db.insert().values()
// update → db.update().set().where()
// delete → db.delete().where()
// deleteMany → db.delete().where()
```

**Steps:**

1. 读取 `db/schema.ts` 确认 `sysPriceUnit` 的列名和类型
2. 重写 `price-unit.service.ts`，将所有 `prisma.*` 调用替换为 `db.*` 调用
3. 修改 import：`import prisma from '../utils/prisma'` → `import db from '../utils/db'`
4. 运行 typecheck 确认无错误
5. 手动测试相关 API 确认功能正常
6. Commit:
```bash
git add server/services/price-unit.service.ts
git commit -m "feat(migrate): convert price-unit.service to drizzle orm"
```

**迁移模板（供后续服务参考）：**

```typescript
// 列表查询模板
const { page, pageSize } = parsePagination(query)
const { offset, limit } = paginateOffset({ page, pageSize })

const conditions: SQL[] = []
if (name) conditions.push(like(table.name, `%${name}%`))
if (status !== undefined) conditions.push(eq(table.status, status))

const whereClause = conditions.length > 0 ? and(...conditions) : undefined

const [rows, countResult] = await Promise.all([
  db.select().from(table)
    .where(whereClause)
    .orderBy(asc(table.sort))
    .offset(offset)
    .limit(limit),
  db.select({ count: count() }).from(table).where(whereClause),
])
const total = countResult[0]?.count ?? 0
```

---

### Task 1.2: 迁移 audit-log.service.ts

**Files:**
- Modify: `server/services/audit-log.service.ts`
- Modify: `server/utils/audit.ts` (也使用 prisma)

**注意:** `audit.ts` 是写审计日志的工具函数，被 `server/plugins/audit.ts` 调用。迁移 audit-log.service 时需要同时迁移 audit.ts。

**Steps:**

1. 重写 `audit-log.service.ts`（只有列表查询）
2. 重写 `server/utils/audit.ts`（`prisma.sysAuditLog.create` → `db.insert(sysAuditLog).values()`）
3. typecheck + 手动测试
4. Commit:
```bash
git add server/services/audit-log.service.ts server/utils/audit.ts
git commit -m "feat(migrate): convert audit-log to drizzle orm"
```

---

### Task 1.3: 迁移 notification.service.ts

**Files:**
- Modify: `server/services/notification.service.ts`

**涉及操作:** CRUD + `updateMany`（标记已读）

**Steps:**
1. 重写所有查询，`updateMany` → `db.update().set().where()`
2. typecheck + 手动测试
3. Commit

---

### Task 1.4: 迁移 dict.service.ts

**Files:**
- Modify: `server/services/dict.service.ts`

**涉及操作:** 字典类型 + 字典数据的 CRUD，有 1 个 include（字典数据关联字典类型）

**Steps:**
1. 重写查询，`include: { dictType: true }` → `leftJoin(sysDictData, sysDictType, ...)`
2. typecheck + 手动测试
3. Commit

---

### Task 1.5: 迁移 file.service.ts

**Files:**
- Modify: `server/services/file.service.ts`

**涉及操作:** 纯 CRUD，无关系

**Steps:**
1. 重写查询
2. typecheck + 手动测试
3. Commit

---

### Task 1.6: 迁移 category.service.ts

**Files:**
- Modify: `server/services/category.service.ts`

**涉及操作:** CRUD + `count`（检查是否有关联内容）

**Steps:**
1. 重写查询
2. typecheck + 手动测试
3. Commit

---

### Task 1.7: 迁移 content.service.ts

**Files:**
- Modify: `server/services/content.service.ts`

**涉及操作:** CRUD + `{ increment: 1 }`（点击计数）+ 1 个 include（category）

**Drizzle increment 等价：**
```typescript
// Prisma: { clickCount: { increment: 1 } }
// Drizzle:
db.update(sysContent)
  .set({ clickCount: sql`${sysContent.clickCount} + 1` })
  .where(eq(sysContent.id, id))
```

**Steps:**
1. 重写查询，特别注意 increment 操作
2. typecheck + 手动测试
3. Commit

---

### Task 1.8: 迁移 region.service.ts

**Files:**
- Modify: `server/services/region.service.ts`

**涉及操作:** CRUD + 自引用层级查询（parentId）

**Steps:**
1. 重写查询
2. typecheck + 手动测试
3. Commit

---

### Task 1.9: 迁移 merchant-category.service.ts + product-category.service.ts

**Files:**
- Modify: `server/services/merchant-category.service.ts`
- Modify: `server/services/product-category.service.ts`

**涉及操作:** 简单 CRUD + `count`（检查关联）

**Steps:**
1. 批量重写两个服务
2. typecheck + 手动测试
3. Commit:
```bash
git commit -m "feat(migrate): convert merchant-category and product-category to drizzle"
```

---

### Task 1.10: 迁移 monitor.service.ts

**Files:**
- Modify: `server/services/monitor.service.ts`

**涉及操作:** 主要是 Redis 缓存操作，只有 `systemInfo()` 方法使用 Prisma（`$queryRaw\`SELECT VERSION()\``）

**Drizzle raw SQL 等价：**
```typescript
// Prisma: prisma.$queryRaw`SELECT VERSION() as version`
// Drizzle:
import { sql } from 'drizzle-orm'
const result = await db.execute(sql`SELECT VERSION() as version`)
```

**Steps:**
1. 只修改 `systemInfo()` 方法中的 1 行 raw query
2. typecheck + 手动测试
3. Commit

---

### Phase 1 验证点

完成所有 Task 1.x 后：

1. 运行完整 typecheck：
```bash
npx nuxi typecheck
```

2. 启动开发服务器测试所有已迁移服务对应的页面：
   - 系统监控 (`/admin/monitor/cache`, `/admin/monitor/server`)
   - 字典管理 (`/admin/system/dict-type`, `/admin/system/dict-data`)
   - 文件管理
   - 内容管理 (`/admin/content/category`, `/admin/content/article`)
   - 审计日志
   - 通知中心
   - 地区管理
   - 价格单位管理

3. Commit:
```bash
git commit -m "feat(migrate): complete phase 1 - simple services migrated to drizzle"
```

---

## Phase 2 — 中等复杂度服务迁移（有关系查询 + 聚合）

### Task 2.1: 迁移 language.service.ts

**Files:**
- Modify: `server/services/language.service.ts`

**涉及操作:** CRUD + `updateMany`（重置 isDefault）+ `findFirst` + `{ not: id }` 条件

**Drizzle `{ not: id }` 等价：**
```typescript
// Prisma: where: { isDefault: true, id: { not: id } }
// Drizzle:
.and(eq(sysLanguage.isDefault, true), not(eq(sysLanguage.id, id)))
```

**Steps:**
1. 重写所有查询
2. typecheck + 手动测试
3. Commit

---

### Task 2.2: 迁移 translation.service.ts

**Files:**
- Modify: `server/services/translation.service.ts`

**涉及操作:** CRUD + `distinct` + `upsert`（复合唯一约束）+ `batchUpsert` + `deleteMany`

**Drizzle distinct 等价：**
```typescript
// Prisma: select: { namespace: true }, distinct: ['namespace']
// Drizzle:
import { sql } from 'drizzle-orm'
db.select({ namespace: sysTranslation.namespace })
  .from(sysTranslation)
  .groupBy(sysTranslation.namespace)
  .orderBy(asc(sysTranslation.namespace))
```

**Drizzle upsert (复合唯一) 等价：**
```typescript
// Prisma: upsert({ where: { namespace_key_locale: { ... } }, update: ..., create: ... })
// Drizzle:
db.insert(sysTranslation)
  .values({ namespace, key, locale, value })
  .onDuplicateKeyUpdate({ set: { value } })
```

**Steps:**
1. 重写所有查询，特别注意 distinct 和 upsert
2. `batchUpsert` 改为使用 `db.insert().values([...]).onDuplicateKeyUpdate()` 批量操作
3. typecheck + 手动测试
4. Commit

---

### Task 2.3: 迁移 user.service.ts

**Files:**
- Modify: `server/services/user.service.ts`

**涉及操作:** CRUD + `include: { roles: { include: { role: true } } }`（2 层嵌套）+ `createMany`（角色分配）

**Drizzle join 等价：**
```typescript
// Prisma: include: { roles: { include: { role: true } } }
// Drizzle:
const userWithRoles = await db
  .select({
    user: sysUser,
    roleId: sysUserRole.roleId,
    role: sysRole,
  })
  .from(sysUser)
  .innerJoin(sysUserRole, eq(sysUser.id, sysUserRole.userId))
  .innerJoin(sysRole, eq(sysUserRole.roleId, sysRole.id))
  .where(eq(sysUser.id, userId))

// 然后在 JS 中重组结构
```

**Steps:**
1. 重写所有查询，2 层 include 改为 join
2. `createMany` (角色分配) → 先 `deleteMany` 再批量 `insert`
3. typecheck + 手动测试
4. Commit

---

### Task 2.4: 迁移 role.service.ts

**Files:**
- Modify: `server/services/role.service.ts`

**涉及操作:** CRUD + `deleteMany` + `createMany`（权限分配）

**Steps:**
1. 重写查询
2. 权限分配逻辑：`deleteMany` 清除旧关联 → `insert` 批量插入新关联
3. typecheck + 手动测试
4. Commit

---

### Task 2.5: 迁移 permission.service.ts

**Files:**
- Modify: `server/services/permission.service.ts`

**涉及操作:** CRUD + 树形结构查询 + `getMenus`/`getButtonPermissions`（复杂 RBAC 查询，多层 include + `{ in: [...] }` + `select` only）

**Drizzle `{ in: [...] }` 等价：**
```typescript
// Prisma: where: { id: { in: permissionIds }, status: 1, type: { in: [0, 1] } }
// Drizzle:
import { inArray } from 'drizzle-orm'
.where(and(
  inArray(sysPermission.id, permissionIds),
  eq(sysPermission.status, 1),
  inArray(sysPermission.type, [0, 1])
))
```

**Steps:**
1. 重写所有查询
2. `getMenus` 和 `getButtonPermissions` 改为 join 查询
3. typecheck + 手动测试
4. Commit

---

### Task 2.6: 迁移 product.service.ts

**Files:**
- Modify: `server/services/product.service.ts`

**涉及操作:** CRUD + `include: { specs: { include: { unit: true } } }`（2 层嵌套）+ 批量操作（specs）

**Steps:**
1. 重写查询
2. specs 嵌套改为 join
3. typecheck + 手动测试
4. Commit

---

### Task 2.7: 迁移 cart.service.ts

**Files:**
- Modify: `server/services/cart.service.ts`

**涉及操作:** CRUD + 2 层 include（product.specs.unit, merchant）+ `aggregate._sum` + `findFirst` + `deleteMany`

**Drizzle aggregate._sum 等价：**
```typescript
// Prisma: aggregate({ where: { userId }, _sum: { quantity: true } })
// Drizzle:
const result = await db.select({
  total: sql<number>`coalesce(sum(${sysCart.quantity}), 0)`.mapWith(Number),
}).from(sysCart).where(eq(sysCart.userId, userId))
return result[0]?.total ?? 0
```

**Steps:**
1. 重写所有查询
2. include 改为 join
3. aggregate 改为 sql 聚合
4. typecheck + 手动测试
5. Commit

---

### Task 2.8: 迁移 rating.service.ts

**Files:**
- Modify: `server/services/rating.service.ts`

**涉及操作:** CRUD + `aggregate._avg._count` + `groupBy` + include

**Drizzle groupBy 等价：**
```typescript
// Prisma: groupBy({ by: ['rating'], where: { merchantId }, _count: { rating: true } })
// Drizzle:
const distribution = await db
  .select({
    rating: sysRating.rating,
    count: count(),
  })
  .from(sysRating)
  .where(eq(sysRating.merchantId, merchantId))
  .groupBy(sysRating.rating)
```

**Steps:**
1. 重写所有查询
2. aggregate + groupBy 改为 Drizzle 聚合
3. typecheck + 手动测试
4. Commit

---

### Phase 2 验证点

1. `npx nuxi typecheck` 无错误
2. 测试所有已迁移服务对应的页面
3. Commit:
```bash
git commit -m "feat(migrate): complete phase 2 - medium complexity services migrated"
```

---

## Phase 3 — 高复杂度服务迁移（深层嵌套 + 事务）

### Task 3.1: 迁移 auth.service.ts（最复杂）

**Files:**
- Modify: `server/services/auth.service.ts`

**涉及操作:** 4 层嵌套 include（`user.roles.role.permissions.permission` + `user.menus.permission`）+ 登录/注册/密码修改

**这是整个迁移中最复杂的部分。** Prisma 的 4 层嵌套 include 需要改为多个 JOIN + JS 结果重组。

**getUserInfo 迁移示例：**
```typescript
// Prisma:
const user = await prisma.sysUser.findUnique({
  where: { id: userId },
  include: {
    roles: {
      include: {
        role: {
          include: { permissions: { include: { permission: true } } },
        },
      },
    },
  },
})

// Drizzle:
const rows = await db
  .select({
    userId: sysUser.id,
    username: sysUser.username,
    nickname: sysUser.nickname,
    email: sysUser.email,
    phone: sysUser.phone,
    avatar: sysUser.avatar,
    status: sysUser.status,
    roleCode: sysRole.code,
    permissionCode: sysPermission.code,
  })
  .from(sysUser)
  .innerJoin(sysUserRole, eq(sysUser.id, sysUserRole.userId))
  .innerJoin(sysRole, eq(sysUserRole.roleId, sysRole.id))
  .innerJoin(sysRolePermission, eq(sysRole.id, sysRolePermission.roleId))
  .innerJoin(sysPermission, eq(sysRolePermission.permissionId, sysPermission.id))
  .where(eq(sysUser.id, userId))

// 重组结果（与原逻辑一致）
if (rows.length === 0) throw createError({ statusCode: 404, message: '用户不存在' })
const roles = [...new Set(rows.map(r => r.roleCode))]
const permissions = [...new Set(rows.map(r => r.permissionCode).filter(Boolean))] as string[]
```

**getUserMenus 迁移示例：** 类似结构，额外包含 user.menus 的 JOIN。

**Steps:**
1. 重写 `login` — 简单 CRUD，无 include
2. 重写 `register` — 简单 CRUD
3. 重写 `getUserInfo` — 4 层 include → 多个 JOIN + 重组
4. 重写 `getUserMenus` — 4 层 include → 多个 JOIN + 重组
5. 重写 `updateProfile` + `changePassword` — 简单 update
6. typecheck + 手动测试（重点测试登录、获取用户信息、获取菜单权限）
7. Commit:
```bash
git commit -m "feat(migrate): convert auth.service to drizzle orm (4-level joins)"
```

---

### Task 3.2: 迁移 merchant.service.ts

**Files:**
- Modify: `server/services/merchant.service.ts`

**涉及操作:** 3 层嵌套 include（`productCategories`, `products.specs.unit`）+ OR keyword search + select-only includes

**findById 迁移（最复杂的查询）：**
```typescript
// 需要 3 个独立查询 + JS 重组（比嵌套 include 更清晰）:
// 1. merchant + category + region (2 JOIN)
// 2. productCategories (1 JOIN + filter)
// 3. products + specs + unit (3 JOIN + filter + sort)
// 然后在 JS 中组装完整结果
```

**Steps:**
1. 重写 `list` — 1 层 include（category, region）→ 2 个 LEFT JOIN
2. 重写 `listPublic` — 同上
3. 重写 `findById` — 3 层 include → 拆分为 3 个查询 + JS 重组
4. 重写 `create` + `update` + `delete` — 简单 CRUD
5. typecheck + 手动测试
6. Commit

---

### Task 3.3: 迁移 order.service.ts（事务）

**Files:**
- Modify: `server/services/order.service.ts`

**涉及操作:** `$transaction` + nested create（`items: { create: orderItems }`）+ Decimal 转换

**Drizzle transaction 等价：**
```typescript
// Prisma: prisma.$transaction(async (tx) => { ... })
// Drizzle:
const result = await db.transaction(async (tx) => {
  // tx 可以执行所有 drizzle 操作
  const [order] = await tx.insert(sysOrder).values({ ... }).$returningId()
  await tx.insert(sysOrderItem).values(orderItems.map(item => ({ ... orderId: order.id })))
  return order
})
```

**注意:** `items: { create: orderItems }` (Prisma nested create) 需要改为两步 insert。

**Steps:**
1. 重写 `create` — transaction + nested create → transaction + 分步 insert
2. 重写 `list` — 1 层 include（merchant, items）→ LEFT JOIN
3. 重写 `findById` — 同上
4. 重写 `updateStatus` + `cancel` — 简单 update
5. **移除所有 `Number()` Decimal 转换** — Drizzle 直接返回 number
6. typecheck + 手动测试（重点测试下单流程）
7. Commit:
```bash
git commit -m "feat(migrate): convert order.service to drizzle with transaction"
```

---

### Phase 3 验证点

1. `npx nuxi typecheck` 无错误
2. 全面测试：登录、用户信息、菜单权限、商家详情（含商品+规格）、购物车、下单、评价
3. Commit:
```bash
git commit -m "feat(migrate): complete phase 3 - complex services migrated"
```

---

## Phase 4 — Portal API 迁移

### Task 4.1: 迁移 portal/auth 直接 Prisma 调用

**Files:**
- Modify: `server/api/portal/auth/login.post.ts`
- Modify: `server/api/portal/auth/register.post.ts`
- Modify: `server/api/portal/auth/userinfo.get.ts`
- Modify: `server/api/portal/auth/profile.put.ts`
- Modify: `server/api/portal/auth/change-password.put.ts`

**策略:** 这些文件直接调用 Prisma 而不经过 service。迁移时有两种选择：
- A) 直接在 API 文件中使用 db（快速但不优雅）
- **B) 推荐：复用已迁移的 authService 方法**（如果 API 逻辑可以委托给 service）

**Steps:**
1. 检查每个 portal auth API 的逻辑，尽可能复用 `authService` 已有的方法
2. 如果必须直接操作 DB，改用 `db.*` 调用
3. typecheck + 手动测试前台登录/注册/个人信息
4. Commit

---

### Task 4.2: 迁移 portal/address 直接 Prisma 调用

**Files:**
- Modify: `server/api/portal/address/index.get.ts`
- Modify: `server/api/portal/address/index.post.ts`
- Modify: `server/api/portal/address/[id].put.ts`
- Modify: `server/api/portal/address/[id].delete.ts`

**策略:** 考虑到这些是 address CRUD 操作，可以复用已有的 `address.service.ts`（如果存在）或直接用 db。

**Steps:**
1. 重写所有 4 个 API 文件
2. typecheck + 手动测试
3. Commit:
```bash
git commit -m "feat(migrate): convert portal api files to drizzle orm"
```

---

## Phase 5 — 清理 Prisma 残留

### Task 5.1: 迁移测试文件

**Files:**
- Modify: `tests/__mocks__/prisma.ts` → 重写为 `tests/__mocks__/db.ts`
- Modify: `tests/server/services/auth.test.ts`

**策略:** 重写 mock 为 Drizzle 风格。可以使用 vitest 的 mock 功能 mock `db` 模块。

**Steps:**
1. 创建 `tests/__mocks__/db.ts` — mock drizzle 的 db 对象
2. 更新 `auth.test.ts` 使用新 mock
3. 运行测试确认通过：
```bash
npm run test
```
4. Commit

---

### Task 5.2: 迁移 Seed 文件

**Files:**
- Modify: `prisma/seed.ts` → 移动/重写为 `db/seed.ts`

**涉及操作:** ~40 个 `upsert` 调用，562 行

**Drizzle upsert 等价：**
```typescript
// Prisma: upsert({ where: { code: 'xxx' }, update: { ... }, create: { ... } })
// Drizzle:
await db.insert(sysRole)
  .values({ code: 'admin', name: '超级管理员', ... })
  .onDuplicateKeyUpdate({ set: { name: '超级管理员', ... } })
```

**Steps:**
1. 创建 `db/seed.ts`
2. 将所有 `prisma.sysXxx.upsert()` 转换为 `db.insert(sysXxx).values().onDuplicateKeyUpdate()`
3. 更新 `package.json` 中的 seed 命令
4. 运行 seed 确认成功：
```bash
npm run seed
```
5. Commit:
```bash
git commit -m "feat(migrate): convert seed file to drizzle orm"
```

---

### Task 5.3: 移除 Prisma 残留

**Files:**
- Delete: `prisma/schema.prisma` (已由 `db/schema.ts` 替代)
- Delete: `prisma/seed.ts` (已由 `db/seed.ts` 替代)
- Delete: `prisma.config.ts`
- Delete: `server/utils/prisma.ts` (已由 `server/utils/db.ts` 替代)
- Delete: `server/utils/pagination.ts` (已由 `server/utils/drizzle-pagination.ts` 替代)
- Remove: `@prisma/client`, `@prisma/adapter-mariadb`, `prisma` from `package.json`
- Delete: `tests/__mocks__/prisma.ts` (已由 `tests/__mocks__/db.ts` 替代)

**⚠️ 必须确认所有文件都已迁移后才能执行此步骤！**

**Steps:**
1. 全局搜索确认无残留的 `prisma` 引用：
```bash
grep -r "from.*prisma" server/ --include="*.ts"
grep -r "import.*prisma" server/ --include="*.ts"
```
2. 确认无结果后，删除上述文件
3. 卸载 Prisma 依赖：
```bash
npm uninstall @prisma/client @prisma/adapter-mariadb prisma
```
4. 删除 `prisma/` 目录
5. 运行完整 typecheck + build + test：
```bash
npx nuxi typecheck
npm run build
npm run test
```
6. Commit:
```bash
git commit -m "feat(migrate): remove all prisma remnants - migration complete"
```

---

### Task 5.4: 更新文档

**Files:**
- Modify: `AGENTS.md` — 更新 Tech Stack（Prisma → Drizzle）、目录结构、开发命令
- Modify: `README.md` — 更新技术栈说明和开发命令
- Modify: `.env.example` — 如有需要

**Steps:**
1. 更新 AGENTS.md 中的 ORM 相关描述
2. 更新 README.md
3. Commit:
```bash
git commit -m "docs: update documentation for drizzle orm migration"
```

---

## 迁移检查清单

每完成一个 Phase 后检查：

- [ ] `npx nuxi typecheck` 无新增错误
- [ ] `npm run build` 成功
- [ ] `npm run test` 通过
- [ ] 手动测试相关页面功能正常
- [ ] 无残留的 `prisma` import（grep 确认）
- [ ] Git commit 干净

## 回滚策略

如果某个服务迁移后出现问题：
1. `git checkout` 该服务文件恢复到 Prisma 版本
2. 确认其他已迁移服务不受影响
3. 分析问题后重新迁移

## 预估工作量

| Phase | 预估时间 | Task 数 |
|-------|---------|---------|
| Phase 0 | 30 分钟 | 5 |
| Phase 1 | 2-3 小时 | 10 |
| Phase 2 | 2-3 小时 | 8 |
| Phase 3 | 2-3 小时 | 3 |
| Phase 4 | 1 小时 | 2 |
| Phase 5 | 1 小时 | 4 |
| **总计** | **8-11 小时** | **32** |
