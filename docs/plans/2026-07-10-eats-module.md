# 外卖商家模块（Eats）实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 构建完整的外卖子系统——商家、商品（含规格）、订单、购物车、评价，配套后台管理和 UberEats 风格的前端门户。

**架构：** Nuxt 4 全栈，Prisma + MySQL 数据层，Nitro API 层，Pinia 状态管理。后台页面沿用现有 Element Plus CRUD 模式。门户页面全 Tailwind CSS（不使用 `<style scoped>`），PC/移动端响应式。

**技术栈：** Nuxt 4, Prisma 7 + MySQL, Element Plus（后台）, **Nuxt UI v2（门户）**, Tailwind CSS（门户）, i18n, TypeScript strict

**设计参考：** UberEats（门户），Nuxt UI 官方组件库，现有 `sys_user` CRUD 模式（后台）

---

## 阶段概览

| 阶段 | 范围 | 涉及文件 |
|---|---|---|
| **P1** | 数据库 Schema | `prisma/schema.prisma` + 迁移 + 种子数据补充 |
| **P2** | 共享类型 | `shared/types/api.ts` |
| **P3** | 服务端 API | `server/api/eats/*` + `server/middleware/auth.ts` 白名单 |
| **P4** | 后台管理页面 | `app/pages/admin/eats/*` + `prisma/seed.ts` 菜单条目 |
| **P5** | 门户前端页面 | `app/pages/portal/channel.vue` + `app/pages/portal/merchant/[id].vue` |

---

## P0：前置准备——认证白名单 & 种子菜单准备

### 任务 P0.1：添加 eats API 到认证白名单

**文件：** `server/middleware/auth.ts`

**改动：** 将 `/api/eats/merchant`、`/api/eats/product`、`/api/eats/merchant-category` 加入 `publicPaths` 数组，以便未登录的门户访客可以浏览商家和商品。

```typescript
const publicPaths = [
  '/api/auth/login',
  '/api/eats/merchant',
  '/api/eats/product',
  '/api/eats/merchant-category',
]
```

> 注意：`/api/eats/order`、`/api/eats/cart`、`/api/eats/rating` 保持需要登录。

### 任务 P0.2：添加商家标签字典

**文件：** `prisma/seed.ts`（在现有字典种子附近补充）

新增字典类型 `merchant_tag`，包含标签：`品牌认证`、`食安认证`、`极速配送`、`好评如潮`。

### 任务 P0.3：安装 Nuxt UI（门户模块专用）

**说明：** 引入 `@nuxt/ui` v2（稳定版）来简化 portal 模块的界面开发。Nuxt UI 基于 Tailwind CSS，提供 125+ 开箱即用的组件（按钮、卡片、表单、弹窗、标签、骨架屏等），完美匹配 portal 模块的 Tailwind 技术栈。

**步骤：**

1. 安装依赖：
```bash
npm install @nuxt/ui
```

2. 从 `nuxt.config.ts` 的 `modules` 数组中移除 `@nuxtjs/tailwindcss`（Nuxt UI 会自动注册它及其依赖的 `@nuxt/icon`、`@nuxtjs/color-mode`），改为添加 `@nuxt/ui`：
```typescript
// nuxt.config.ts
modules: ['@element-plus/nuxt', '@pinia/nuxt', '@nuxt/ui', '@nuxtjs/i18n'],
```

3. 保留 `tailwind.config.js` 不变（Nuxt UI 会自动读取其中的自定义颜色 `ubereats`），portal 页面继续使用 Tailwind utility classes。

4. 移除 `package.json` 中的 `@nuxtjs/tailwindcss` 依赖（Nuxt UI 自带）。

**注意事项：**
- 后台管理页面继续使用 Element Plus，不受影响
- portal 页面使用 Nuxt UI 组件 + Tailwind utility classes（不写 `<style scoped>`）
- 两个 UI 库（Element Plus vs Nuxt UI）分别在 admin/portal 布局下使用，互不干扰

---

## P1：数据库 Schema——9 张新表

### 任务 P1.1：在 schema.prisma 中添加模型

**文件：** `prisma/schema.prisma`

按现有规范（`Sys` 前缀、`sys_` 表名、`@map` 映射 snake_case、Int 主键、Int 代替布尔、`@db.VarChar(N)` 声明长度）新增 9 个模型：

#### SysMerchantCategory（商家分类/菜系）

```prisma
model SysMerchantCategory {
  id         Int       @id @default(autoincrement())
  name       String    @db.VarChar(50)
  code       String    @unique @db.VarChar(50)
  icon       String?   @db.VarChar(255)
  sort       Int       @default(0)
  status     Int       @default(1)
  remark     String?   @db.VarChar(500)
  createTime DateTime  @default(now()) @map("create_time")
  updateTime DateTime  @updatedAt @map("update_time")

  merchants SysMerchant[]

  @@map("sys_merchant_category")
}
```

#### SysMerchant（商家/店铺）

```prisma
model SysMerchant {
  id                    Int       @id @default(autoincrement())
  name                  String    @db.VarChar(100)
  code                  String    @unique @db.VarChar(50)
  description           String?   @db.Text
  logo                  String?   @db.VarChar(500)
  coverImage            String?   @map("cover_image") @db.VarChar(500)
  categoryId            Int       @map("category_id")
  contactName           String?   @map("contact_name") @db.VarChar(50)
  contactPhone          String?   @map("contact_phone") @db.VarChar(20)
  address               String?   @db.VarChar(255)
  longitude             Decimal?  @db.Decimal(10, 7)
  latitude              Decimal?  @db.Decimal(10, 7)
  status                Int       @default(1)  // 0=休业 1=营业 2=暂停
  level                 Int       @default(0)  // 0=普通 1=精选 2=品牌
  tags                  String?   @db.Text     // JSON 标签 code 数组
  deliveryFee           Decimal?  @map("delivery_fee") @db.Decimal(10, 2)
  minOrderAmount        Decimal?  @map("min_order_amount") @db.Decimal(10, 2)
  estimatedDeliveryTime Int?      @map("estimated_delivery_time")
  openTime              String?   @map("open_time") @db.VarChar(10)
  closeTime             String?   @map("close_time") @db.VarChar(10)
  rating                Decimal?  @db.Decimal(2, 1)
  ratingCount           Int?      @map("rating_count")
  monthlySales          Int?      @map("monthly_sales")
  isFeatured            Int       @default(0) @map("is_featured")
  isNew                 Int       @default(0) @map("is_new")
  remark                String?   @db.VarChar(500)
  createTime            DateTime  @default(now()) @map("create_time")
  updateTime            DateTime  @updatedAt @map("update_time")

  category         SysMerchantCategory @relation(fields: [categoryId], references: [id])
  productCategories SysProductCategory[]
  products         SysProduct[]
  orders           SysOrder[]
  ratings          SysRating[]
  cartItems        SysCart[]

  @@map("sys_merchant")
}
```

#### SysProductCategory（商品分类——商家内部用）

```prisma
model SysProductCategory {
  id         Int       @id @default(autoincrement())
  name       String    @db.VarChar(50)
  merchantId Int       @map("merchant_id")
  sort       Int       @default(0)
  status     Int       @default(1)
  remark     String?   @db.VarChar(500)
  createTime DateTime  @default(now()) @map("create_time")
  updateTime DateTime  @updatedAt @map("update_time")

  merchant SysMerchant @relation(fields: [merchantId], references: [id], onDelete: Cascade)
  products SysProduct[]

  @@map("sys_product_category")
}
```

#### SysProduct（商品）

```prisma
model SysProduct {
  id           Int       @id @default(autoincrement())
  name         String    @db.VarChar(100)
  code         String    @unique @db.VarChar(50)
  description  String?   @db.Text
  image        String?   @db.VarChar(500)
  categoryId   Int?      @map("category_id")
  merchantId   Int       @map("merchant_id")
  status       Int       @default(1)  // 0=下架 1=上架
  sales        Int       @default(0)
  unit         String?   @db.VarChar(10)
  isRecommended Int      @default(0) @map("is_recommended")
  sort         Int       @default(0)
  remark       String?   @db.VarChar(500)
  createTime   DateTime  @default(now()) @map("create_time")
  updateTime   DateTime  @updatedAt @map("update_time")

  category   SysProductCategory? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  merchant   SysMerchant         @relation(fields: [merchantId], references: [id], onDelete: Cascade)
  specs      SysProductSpec[]
  orderItems SysOrderItem[]
  ratings    SysRating[]
  cartItems  SysCart[]

  @@map("sys_product")
}
```

#### SysProductSpec（规格——独立定价 ⭐）

```prisma
model SysProductSpec {
  id            Int       @id @default(autoincrement())
  productId     Int       @map("product_id")
  name          String    @db.VarChar(50)
  price         Decimal   @db.Decimal(10, 2)
  originalPrice Decimal?  @map("original_price") @db.Decimal(10, 2)
  isDefault     Int       @default(0) @map("is_default")
  stock         Int?      @default(0)
  sort          Int       @default(0)
  status        Int       @default(1)
  createTime    DateTime  @default(now()) @map("create_time")
  updateTime    DateTime  @updatedAt @map("update_time")

  product SysProduct @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@map("sys_product_spec")
}
```

#### SysOrder（订单）

```prisma
model SysOrder {
  id               Int       @id @default(autoincrement())
  orderNo          String    @unique @map("order_no") @db.VarChar(30)
  merchantId       Int       @map("merchant_id")
  userId           Int       @map("user_id")
  totalAmount      Decimal   @map("total_amount") @db.Decimal(10, 2)
  deliveryFee      Decimal?  @map("delivery_fee") @db.Decimal(10, 2)
  serviceFee       Decimal?  @map("service_fee") @db.Decimal(10, 2)
  deliveryType     String?   @map("delivery_type") @db.VarChar(10) // delivery/pickup
  status           String    @default("pending") @db.VarChar(20)
  deliveryAddress  String?   @map("delivery_address") @db.VarChar(255)
  contactName      String?   @map("contact_name") @db.VarChar(50)
  contactPhone     String?   @map("contact_phone") @db.VarChar(20)
  remark           String?   @db.VarChar(500)
  paymentMethod    String?   @map("payment_method") @db.VarChar(20)
  paymentTime      DateTime? @map("payment_time")
  createTime       DateTime  @default(now()) @map("create_time")
  updateTime       DateTime  @updatedAt @map("update_time")

  merchant SysMerchant  @relation(fields: [merchantId], references: [id])
  items    SysOrderItem[]

  @@map("sys_order")
}
```

#### SysOrderItem（订单明细）

```prisma
model SysOrderItem {
  id           Int     @id @default(autoincrement())
  orderId      Int     @map("order_id")
  productId    Int     @map("product_id")
  productName  String  @map("product_name") @db.VarChar(100)
  productImage String? @map("product_image") @db.VarChar(500)
  specName     String? @map("spec_name") @db.VarChar(50)
  price        Decimal @db.Decimal(10, 2)
  quantity     Int
  subtotal     Decimal @db.Decimal(10, 2)

  order SysOrder @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@map("sys_order_item")
}
```

#### SysRating（评价——暂不支持商家回复）

```prisma
model SysRating {
  id         Int      @id @default(autoincrement())
  orderId    Int      @unique @map("order_id")
  userId     Int      @map("user_id")
  merchantId Int      @map("merchant_id")
  productId  Int?     @map("product_id")
  rating     Int      // 1-5
  content    String?  @db.Text
  images     String?  @db.Text  // JSON 图片 URL 数组
  createTime DateTime @default(now()) @map("create_time")

  merchant SysMerchant @relation(fields: [merchantId], references: [id])
  product  SysProduct? @relation(fields: [productId], references: [id], onDelete: SetNull)

  @@map("sys_rating")
}
```

#### SysCart（购物车）

```prisma
model SysCart {
  id         Int      @id @default(autoincrement())
  userId     Int      @map("user_id")
  merchantId Int      @map("merchant_id")
  productId  Int      @map("product_id")
  specName   String?  @map("spec_name") @db.VarChar(50)
  quantity   Int      @default(1)
  createTime DateTime @default(now()) @map("create_time")
  updateTime DateTime @updatedAt @map("update_time")

  merchant SysMerchant @relation(fields: [merchantId], references: [id])
  product  SysProduct  @relation(fields: [productId], references: [id])

  @@map("sys_cart")
}
```

### 任务 P1.2：执行数据库迁移

```bash
npx prisma migrate dev --name add_eats_module
npx prisma generate
```

### 任务 P1.3：补充种子数据

**文件：** `prisma/seed.ts`

补充内容：
1. `merchant_tag` 字典类型，包含字典数据：`品牌认证`、`食安认证`、`极速配送`、`好评如潮`
2. 示例商家分类：中式美食、日式料理、韓式料理、速食快餐、甜點飲品、異國料理
3. 2-3 个示例商家，每个商家附带商品和规格，关联到对应分类

---

## P2：共享类型

### 任务 P2.1：在 shared/types/api.ts 中添加 eats 类型

**文件：** `shared/types/api.ts`

按照现有模式（`UserItem`、`UserQuery`、`UserCreateBody` 等）新增以下类型定义：

```typescript
// ========== Eats Module Types ==========

// --- 商家分类 ---
export interface MerchantCategoryItem {
  id: number
  name: string
  code: string
  icon?: string
  sort: number
  status: number
}

export interface MerchantCategoryQuery {
  page?: number
  pageSize?: number
  name?: string
  status?: number
}

export interface MerchantCategoryCreateBody {
  name: string
  code: string
  icon?: string
  sort?: number
}

// --- 商家 ---
export interface MerchantItem {
  id: number
  name: string
  code: string
  description?: string
  logo?: string
  coverImage?: string
  categoryId: number
  categoryName?: string
  contactName?: string
  contactPhone?: string
  address?: string
  longitude?: number
  latitude?: number
  status: number
  level: number
  tags?: string
  deliveryFee?: number
  minOrderAmount?: number
  estimatedDeliveryTime?: number
  openTime?: string
  closeTime?: string
  rating?: number
  ratingCount?: number
  monthlySales?: number
  isFeatured: number
  isNew: number
  remark?: string
  createTime: string
}

export interface MerchantDetail extends MerchantItem {
  categories: ProductCategoryItem[]
  products: ProductItem[]
}

export interface MerchantQuery {
  page?: number
  pageSize?: number
  name?: string
  categoryId?: number
  status?: number
  level?: number
  isFeatured?: number
  keyword?: string
  longitude?: number
  latitude?: number
  deliveryType?: string
}

export interface MerchantCreateBody {
  name: string
  code: string
  description?: string
  logo?: string
  coverImage?: string
  categoryId: number
  contactName?: string
  contactPhone?: string
  address?: string
  longitude?: number
  latitude?: number
  status?: number
  level?: number
  tags?: string
  deliveryFee?: number
  minOrderAmount?: number
  estimatedDeliveryTime?: number
  openTime?: string
  closeTime?: string
  isFeatured?: number
  isNew?: number
  remark?: string
}

// --- 商品分类 ---
export interface ProductCategoryItem {
  id: number
  name: string
  merchantId: number
  merchantName?: string
  sort: number
  status: number
  remark?: string
}

export interface ProductCategoryQuery {
  page?: number
  pageSize?: number
  merchantId?: number
  name?: string
  status?: number
}

// --- 商品规格 ---
export interface ProductSpecItem {
  id: number
  productId: number
  name: string
  price: number
  originalPrice?: number
  isDefault: number
  stock?: number
  sort: number
  status: number
}

// --- 商品 ---
export interface ProductItem {
  id: number
  name: string
  code: string
  description?: string
  image?: string
  categoryId?: number
  categoryName?: string
  merchantId: number
  merchantName?: string
  status: number
  sales: number
  unit?: string
  isRecommended: number
  sort: number
  remark?: string
  specs: ProductSpecItem[]
  priceRange?: string
  createTime: string
}

export interface ProductQuery {
  page?: number
  pageSize?: number
  merchantId?: number
  categoryId?: number
  name?: string
  status?: number
  isRecommended?: number
}

export interface ProductCreateBody {
  name: string
  code: string
  description?: string
  image?: string
  categoryId?: number
  merchantId: number
  status?: number
  unit?: string
  isRecommended?: number
  sort?: number
  remark?: string
  specs: Omit<ProductSpecItem, 'id' | 'productId' | 'createTime' | 'updateTime'>[]
}

// --- 订单 ---
export interface OrderItem {
  id: number
  orderNo: string
  merchantId: number
  merchantName?: string
  userId: number
  totalAmount: number
  deliveryFee?: number
  serviceFee?: number
  deliveryType?: string
  status: string
  deliveryAddress?: string
  contactName?: string
  contactPhone?: string
  remark?: string
  paymentMethod?: string
  paymentTime?: string
  items: OrderDetailItem[]
  createTime: string
}

export interface OrderDetailItem {
  id: number
  productId: number
  productName: string
  productImage?: string
  specName?: string
  price: number
  quantity: number
  subtotal: number
}

export interface OrderQuery {
  page?: number
  pageSize?: number
  merchantId?: number
  userId?: number
  status?: string
  orderNo?: string
  deliveryType?: string
}

// --- 购物车 ---
export interface CartItem {
  id: number
  userId: number
  merchantId: number
  merchantName?: string
  productId: number
  productName?: string
  productImage?: string
  specName?: string
  price?: number
  quantity: number
  createTime: string
}

// --- 评价 ---
export interface RatingItem {
  id: number
  orderId: number
  userId: number
  username?: string
  merchantId: number
  productId?: number
  productName?: string
  rating: number
  content?: string
  images?: string
  createTime: string
}

export interface RatingQuery {
  page?: number
  pageSize?: number
  merchantId?: number
  productId?: number
  rating?: number
}
```

---

## P3：服务端 API

### 任务 P3.1：商家分类 CRUD

**文件：**
- `server/api/eats/merchant-category/index.get.ts` — 分页列表
- `server/api/eats/merchant-category/all.get.ts` — 全量列表（供下拉框用）
- `server/api/eats/merchant-category/index.post.ts` — 新增
- `server/api/eats/merchant-category/[id].put.ts` — 编辑
- `server/api/eats/merchant-category/[id].delete.ts` — 删除

严格遵循 `server/api/system/user/*.ts` 的模式：
- `index.get.ts`：`getQuery` → `findMany` + `count` → `{ code: 200, data: { list, total, page, pageSize } }`
- `index.post.ts`：`readBody` → 校验 → 查重 → `create`
- `[id].put.ts`：`getRouterParam` + `readBody` → `findUnique` → `update`
- `[id].delete.ts`：`getRouterParam` → `findUnique` → `delete`

### 任务 P3.2：商家 CRUD

**文件：**
- `server/api/eats/merchant/index.get.ts` — 分页列表，支持按 name/categoryId/status/level/isFeatured/keyword 筛选，通过 `include` 关联分类名称，支持按 rating 排序
- `server/api/eats/merchant/index.post.ts` — 新增（校验必填字段、code 唯一性）
- `server/api/eats/merchant/[id].get.ts` — 详情：商家信息 + 商品分类 + 商品（含规格）
- `server/api/eats/merchant/[id].put.ts` — 编辑
- `server/api/eats/merchant/[id].delete.ts` — 删除（检查没有进行中的订单）

### 任务 P3.3：商品分类 CRUD

**文件：**
- `server/api/eats/product-category/index.get.ts` — 按 `merchantId` 筛选（必填参数）
- `server/api/eats/product-category/index.post.ts` — 新增
- `server/api/eats/product-category/[id].put.ts` — 编辑
- `server/api/eats/product-category/[id].delete.ts` — 删除

### 任务 P3.4：商品 CRUD

**文件：**
- `server/api/eats/product/index.get.ts` — 按 merchantId/categoryId/status 筛选，附带规格
- `server/api/eats/product/index.post.ts` — 新增商品 + 规格（事务包裹：先创建商品，再批量创建规格）
- `server/api/eats/product/[id].get.ts` — 单个商品详情附带规格
- `server/api/eats/product/[id].put.ts` — 编辑商品 + 批量更新规格（删旧规格建新规格）
- `server/api/eats/product/[id].delete.ts` — 删除

### 任务 P3.5：订单 CRUD

**文件：**
- `server/api/eats/order/index.get.ts` — 按 merchantId/userId/status 分页列表
- `server/api/eats/order/index.post.ts` — 下单（事务：创建订单 + 明细，计算金额）
- `server/api/eats/order/[id].get.ts` — 订单详情附带明细
- `server/api/eats/order/[id].put.ts` — 编辑（备注、联系方式等）
- `server/api/eats/order/[id]/status.put.ts` — 状态流转

### 任务 P3.6：购物车 API

**文件：**
- `server/api/eats/cart/index.get.ts` — 获取当前用户的购物车（附带商品名称/图片/价格）
- `server/api/eats/cart/index.post.ts` — 添加商品（upsert：同一商品+规格存在则累加数量）
- `server/api/eats/cart/[id].put.ts` — 更新数量
- `server/api/eats/cart/[id].delete.ts` — 删除购物车项
- `server/api/eats/cart/clear.post.ts` — 清空购物车

### 任务 P3.7：评价 API

**文件：**
- `server/api/eats/rating/index.get.ts` — 按 merchantId/productId 获取评价列表
- `server/api/eats/rating/index.post.ts` — 创建评价（校验订单属于当前用户）
- `server/api/eats/rating/[id].delete.ts` — 删除评价

---

## P4：后台管理页面

### 任务 P4.1：在种子数据中添加外卖菜单条目

**文件：** `prisma/seed.ts`

在权限数组中新增：

| id | name | code | type | parentId | path | icon | sort |
|---|---|---|---|---|---|---|---|
| 200 | 外卖管理 | | 0 | 0 | | Shop | 5 |
| 201 | 商家分类 | eats:category:list | 1 | 200 | /admin/eats/category | | 1 |
| 202 | 商家管理 | eats:merchant:list | 1 | 200 | /admin/eats/merchant | | 2 |
| 203 | 商品分类 | eats:product-category:list | 1 | 200 | /admin/eats/product-category | | 3 |
| 204 | 商品管理 | eats:product:list | 1 | 200 | /admin/eats/product | | 4 |
| 205 | 订单管理 | eats:order:list | 1 | 200 | /admin/eats/order | | 5 |
| 206 | 评价管理 | eats:rating:list | 1 | 200 | /admin/eats/rating | | 6 |

同时新增按钮级权限：

| id | name | code | type | parentId |
|---|---|---|---|---|
| 210 | 新增商家 | eats:merchant:create | 2 | 202 |
| 211 | 编辑商家 | eats:merchant:edit | 2 | 202 |
| 212 | 删除商家 | eats:merchant:delete | 2 | 202 |
| 213 | 新增商品 | eats:product:create | 2 | 204 |
| 214 | 编辑商品 | eats:product:edit | 2 | 204 |
| 215 | 删除商品 | eats:product:delete | 2 | 204 |
| 216 | 订单操作 | eats:order:operate | 2 | 205 |
| 217 | 删除评价 | eats:rating:delete | 2 | 206 |

### 任务 P4.2：商家分类管理页面

**文件：** `app/pages/admin/eats/category.vue`

遵循 `<admin>/system/user.vue` 的模式：
- `definePageMeta({ layout: 'admin', middleware: 'auth' })`
- 搜索卡片：按名称筛选
- 表格卡片：el-table 列（名称、编码、图标预览、排序、状态标签、创建时间、操作）
- 弹窗：el-form（名称、编码、图标 URL、排序、状态）
- 标准 CRUD 处理方法

### 任务 P4.3：商家管理页面

**文件：** `app/pages/admin/eats/merchant.vue`

- 搜索卡片：名称、分类下拉（从 `/api/eats/merchant-category/all` 获取）、状态、等级
- 表格：logo 缩略图、名称、编码、分类、联系人、状态标签、等级标签、评分、月销量、操作
- 弹窗分区：基本信息 + 经营信息
  - 基本信息：名称、编码、简介(textarea)、logo URL、封面图 URL、分类下拉、联系人、电话、地址
  - 经营信息：状态、等级、标签（字典多选）、配送费、起送价、预计配送分钟、营业时间、是否推荐/新店
  - 位置：经度、纬度
- 删除需确认

### 任务 P4.4：商品分类管理页面

**文件：** `app/pages/admin/eats/product-category.vue`

- 搜索卡片：商家下拉（从 API 获取）+ 名称
- 表格：名称、所属商家、排序、状态、操作
- 弹窗：名称、商家下拉、排序、状态

### 任务 P4.5：商品管理页面

**文件：** `app/pages/admin/eats/product.vue`

- 搜索卡片：商家下拉、分类下拉（依赖商家联动）、名称、状态
- 表格：图片、名称、编码、所属商家、分类、规格摘要（大杯¥15、中杯¥12）、状态标签、销量、操作
- 弹窗：基本信息 + 规格子表格
  - 基本信息：名称、编码、简介、图片、商家下拉、分类下拉、单位、排序、状态
  - 规格（动态列表）：名称、价格、原价、是否默认(radio)、库存。**至少需要一个规格**。使用 el-button 增删行
- 删除前校验是否有进行中的订单引用该商品

### 任务 P4.6：订单管理页面

**文件：** `app/pages/admin/eats/order.vue`

- 搜索卡片：订单号、商家下拉、状态下拉（多选）、日期范围
- 表格：订单号、商家、总金额、配送类型、状态（el-tag 颜色映射）、联系方式、创建时间、操作
- 弹窗（只读详情）：全部订单字段 + 明细表格（商品、规格、价格、数量、小计）
- 操作列中根据当前状态显示可执行操作按钮，如「确认配送」「完成订单」

### 任务 P4.7：评价管理页面

**文件：** `app/pages/admin/eats/rating.vue`

- 搜索卡片：商家下拉、评分筛选(1-5)
- 表格：用户名、商品名、评分（星星展示）、内容、图片（可展开）、创建时间、操作
- 弹窗：只读详情
- 删除按钮

---

## P5：门户前端页面

### 任务 P5.1：更新首页的 handleSearch 和城市点击

**文件：** `app/pages/portal/index.vue`

**改动：**
1. `handleSearch()`：输入地址点击搜索后，跳转到 `/portal/channel?address=${encodeURIComponent(address)}`
2. 城市列表每项增加 `@click`：点击城市跳转到 `/portal/channel?city=${cityName}&address=${cityName}`
3. **首页除上述改动外，其余内容完全保持不变，不新增任何板块**

### 任务 P5.2：频道页

**文件：** `app/pages/portal/channel.vue`

**布局：** `portal`
**i18n：** 使用现有 `useI18n()`，在 locale 文件中新增 key
**样式：** Tailwind CSS + **Nuxt UI 组件**，不写 `<style scoped>`，UberEats 色板

**Nuxt UI 组件使用指引（推荐，非强制）：**
- `UCard` — 商家卡片、信息卡片
- `USkeleton` — 列表/卡片骨架屏加载态
- `UBadge` / `UTag` — 商家标签徽章
- `USelect` / `USelectMenu` — 下拉选择
- `UInput` / `UInputMenu` — 搜索输入框
- `UIcon` — 图标展示
- `UPagination` — 分页
- `UModal` — 弹窗（规格选择等）
- `UButton` — 操作按钮

**页面结构：**
```
Banner 区域（类似首页英雄区风格，更紧凑）：
  ├── 背景图（复用 ubereats CDN）
  ├── 标题："美食送到 {address}"
  └── 搜索栏（预填地址参数，用 UInput）

商家分类（横向滚动标签，用 UBadge/UTag）：
  ├── "全部"（默认选中）
  ├── 遍历商家分类 API 数据
  └── 点击按分类筛选

商家列表（响应式网格）：
  ├── PC：3 列卡片（用 UCard）
  └── 手机：1 列全宽
  每张卡片：
    ├── 封面图（merchant.coverImage 或占位图）
    ├── Logo + 名称 + 评分（★ 4.5）
    ├── 标签（UBadge：品牌认证、食安认证等徽章）
    ├── 配送信息：配送费、起送价、预计时间
    └── 点击 → 跳转 /portal/merchant/:id

加载状态：骨架屏卡片（用 USkeleton）
空状态："附近暂无商家" 配图
```

**数据流：**
- `onMounted`：读取 `route.query.address` 或 `route.query.city`
- 获取商家：`GET /api/eats/merchant?keyword=${address}&pageSize=20`（带坐标的话传 longitude/latitude）
- 获取分类：`GET /api/eats/merchant-category/all`
- 点击分类标签筛选前端过滤

**在所有三个 locale 文件中添加 i18n 键：**
```json
"channel": {
  "title": "美食送到 {address}",
  "addressPlaceholder": "输入地址",
  "search": "搜尋",
  "allCategories": "全部",
  "noMerchants": "附近暫無商家",
  "deliveryFee": "外送費",
  "minOrder": "最低消費",
  "estimatedTime": "約 {min} 分鐘",
  "free": "免費"
}
```

### 任务 P5.3：商家详情页

**文件：** `app/pages/portal/merchant/[id].vue`

**布局：** `portal`
**样式：** Tailwind CSS + **Nuxt UI 组件**，响应式，不写 `<style scoped>`

**Nuxt UI 组件使用指引（推荐，非强制）：**
- `UCard` — 商家信息卡片、商品卡片
- `UTabs` — 商品分类 Tab 切换
- `UModal` — 规格选择弹窗
- `UBadge` / `UTag` — 商家标签、状态标签
- `USkeleton` — 加载态骨架屏
- `UButton` — 操作按钮（加入购物车、去结算）
- `UIcon` — 图标
- `UAvatar` — 商家 Logo
- `USlideover` — 购物车侧边栏（PC）
- `UBottomSheet` — 购物车底部浮层（手机）

**页面结构：**
```
头部区：
  ├── 封面图（全宽，短高度）
  ├── 商家 Logo（UAvatar）+ 名称 + 评分 + 销量 + 标签（UBadge）
  ├── 配送信息条：配送费、起送价、预计时间、营业时间
  └── 配送类型切换（复用之前的 orderType Dropdown）

内容区（PC 双栏 / 手机单栏）：
  左栏（较窄，PC 独占）：
    ├── 商家信息卡片（UCard：地址、电话、营业时间）
    └── 购物车侧边栏（USlideover，添加商品后显示）
  右栏（主区域）：
    ├── 商品分类 Tab（UTabs，横向滚动）
    │   └── 每个 Tab 展示该分类下的商品
    ├── 商品卡片（UCard）：
    │   ├── 图片（左）+ 名称、简介、销量
    │   ├── 价格：最低规格价起（如 "¥12起"）
    │   ├── 单一规格：显示价格 + "加入"（UButton）
    │   └── 多规格："选择规格" → UModal 弹窗选择
    └── ...

购物车（手机 UBottomSheet / PC USlideover）：
  ├── 已添加商品列表（+/- 数量按钮，UButton）
  ├── 合计金额
  └── "去结算"按钮（UButton，需登录）
```

**数据流：**
- `onMounted`：获取 `GET /api/eats/merchant/:id`（返回商家信息 + 商品分类 + 商品含规格）
- 获取评价：`GET /api/eats/rating?merchantId=${id}&pageSize=10`
- 购物车操作：`/api/eats/cart` 相关接口（需要登录）

**i18n 键：**
```json
"merchant": {
  "addToCart": "加入",
  "selectSpec": "選擇規格",
  "selectSpecTitle": "選擇規格",
  "confirm": "確定",
  "cancel": "取消",
  "goToCheckout": "去結算",
  "cart": "購物車",
  "cartEmpty": "購物車是空的",
  "total": "合計",
  "minOrderTip": "還差 ¥{amount} 即可下單",
  "ratings": "評價",
  "noRatings": "暫無評價",
  "deliveryInfo": "配送資訊",
  "address": "地址",
  "phone": "電話",
  "openHours": "營業時間"
}
```

---

## 执行顺序 & 依赖关系

```
P0.1（认证白名单）───────────────────────┐
                                        ├─► P3（API）
P0.2（字典种子）─────┐                   │
                      ├─► P1（Schema）──►│
P1.3（数据种子）─────┘                   │
                                        ├─► P4（后台页面）
P2（共享类型）──────────────────────────►│
                                        └─► P5（门户页面）
                                          依赖 P3 API
```

**安全检查点：**
1. P1 完成后：`npx prisma migrate dev` + `npx prisma generate` — 确认无报错
2. P3 完成后：用 curl/浏览器测试几个关键 API
3. P4 完成后：逐个检查后台管理页面 CRUD 功能正常
4. P5 完成后：完整用户流程测试（首页→搜索→频道→商家→购物车→下单）

---

## 提交策略

每个逻辑任务 = 一个 commit。紧密耦合的文件打包在一起：

```bash
# P0.1 之后
git add server/middleware/auth.ts
git commit -m "feat: 添加 eats 公开 API 路径白名单"

# P0.2 + P1（schema + 种子补充）
git add prisma/schema.prisma prisma/seed.ts
git commit -m "feat: 添加 eats 模块数据库 Schema"

# P2
git add shared/types/api.ts
git commit -m "feat: 添加 eats 模块共享类型"

# 每组 API 单独提交（merchant-category、merchant、product-category、product、order、cart、rating）
# 每个后台页面单独提交
# 每个门户页面单独提交
```

---

## 验收标准

1. [ ] 后台可管理商家分类（增删改查）
2. [ ] 后台可管理商家信息（含标签/等级/位置）
3. [ ] 后台可按商家管理商品分类
4. [ ] 后台可管理商品及多规格（独立定价）
5. [ ] 后台可查看/管理订单，支持状态流转
6. [ ] 后台可查看/删除评价
7. [ ] 门户首页搜索跳转到频道页
8. [ ] 频道页展示附近商家，支持分类筛选
9. [ ] 商家详情页展示分类/商品/规格/购物车/评价
10. [ ] 所有页面响应式（PC + 手机）
11. [ ] 门户页面全部使用 Tailwind CSS（无 `<style scoped>`）
12. [ ] 所有门户新文本支持 i18n 多语言
