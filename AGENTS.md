# Admin App — 通用基础脚手架

Nuxt 4 后台管理系统（RuoYi 风格），定位为通用基础开发脚手架，用于快速搭建业务模块。

> **文档维护规则**: 每次新增/修改功能后，同步更新 `.env.example`、本文件和 `shared/types/api.ts`。

## Tech Stack

| 层 | 技术 |
|---|---|
| 框架 | Nuxt 4 (Vue 3 + Vite + Nitro) |
| UI | Element Plus |
| CSS | Tailwind CSS (仅 Portal 模块使用) |
| ORM | Prisma 7 + MariaDB Adapter |
| 数据库 | MySQL 8.0 |
| 缓存 | Redis (ioredis) |
| 认证 | JWT (jsonwebtoken + bcryptjs) |
| 测试 | Vitest + @nuxt/test-utils |
| 导出 | ExcelJS |
| 语言 | TypeScript (strict mode) |
| i18n | @nuxtjs/i18n (中文/English/日本語) |

## 目录结构

```
shared/types/api.ts       前后端共享类型定义
prisma/                   schema.prisma (10 表) + seed.ts + migrations
server/
  middleware/auth.ts      全局 JWT 认证中间件
  plugins/audit.ts        Nitro 插件，自动记录写操作审计日志
  utils/                  prisma.ts, jwt.ts, redis.ts, audit.ts, fileStorage.ts
  api/auth/               登录/登出/用户信息/菜单
  api/system/             user/role/permission/dict-type/dict-data/...
                          category/content/file/monitor/audit-log/notification
                          online-user/cache
app/
  layouts/admin.vue       后台管理布局（侧边栏+顶栏+通知铃铛）
  layouts/portal.vue      前端门户布局（简洁导航+页脚，无侧边栏）
  components/             RichTextEditor, NotificationBell
  composables/            useRequest(统一API), useFileUpload, useExport(Excel)
  middleware/auth.ts      客户端路由守卫
  stores/auth.ts          Pinia 认证仓库
  pages/
    portal/               前端门户页面（用户端）
      index.vue           UberEats 风格首页
    ...                   各功能页面
tests/                    Vitest 测试
```

## 核心能力

### 1. 前后端共享类型 (`shared/types/api.ts`)

所有 API 响应类型集中定义，前端 import 使用，消除 `any`：

```typescript
import type { ApiResponse, PaginatedData, UserItem } from '#shared/types/api'
const res = await $fetch<ApiResponse<PaginatedData<UserItem>>>('/api/system/user')
```

### 2. 统一 API 封装 (`useRequest`)

```typescript
const { get, post, put, del, loading } = useRequest()
const data = await get<UserItem[]>('/api/system/user', { params: { page: 1 } })
```
- 自动处理 loading / error 状态
- 统一错误消息提示
- 泛型返回类型

### 3. 操作审计日志

- **Nitro 插件** `server/plugins/audit.ts` — 自动拦截 POST/PUT/DELETE 请求，记录操作人、操作类型、目标、详情
- **API** `GET /api/system/audit-log` — 分页查询
- **页面** `/system/audit-log`

### 4. 数据导出 (`useExport`)

```typescript
const { exportExcel, exporting } = useExport()
await exportExcel({
  columns: [{ key: 'username', title: '用户名' }],
  fetchData: () => $fetch('/api/system/user?pageSize=9999'),
  fileName: '用户数据.xlsx',
})
```

### 5. 通知中心

- **API**: 通知列表 / 未读计数 / 标记已读 / 全部已读
- **组件**: `NotificationBell.vue` — 顶栏铃铛图标 + 未读红点 + 下拉预览
- **页面**: `/system/notification` — 全部通知管理
- 支持三种类型: `system` (系统) / `approval` (审批) / `reminder` (提醒)
- 首页 dashboard 展示最新 5 条通知时间轴

### 6. Redis 缓存与工具类

- **客户端**: `server/utils/redis.ts` — 单例 `ioredis` 客户端，自动重连
- **通用方法**: `getRedis()`, `redisGet`, `redisSet`, `redisDel`, `redisScan`, `redisTtl`, `redisInfo`, `redisDbSize`, `redisFlushDb` 等
- **数据结构操作**: `redisStrlen`, `redisLlen`, `redisScard`, `redisHlen`, `redisZcard`, `redisHgetall`, `redisLrange`, `redisSmembers`, `redisZrange`
- **配置**: 通过 `.env` 中 `REDIS_URL` 配置连接地址，`REDIS_DB` 指定数据库编号（默认 0）

### 7. 在线用户管理

- **原理**: 登录时将用户会话写入 Redis（`online_user:{userId}` + `online_token:{token}`），TTL=24h
- **API**: `GET /api/system/online-user` (分页搜索) / `DELETE /api/system/online-user/:userId` (强退)
- **页面**: `/system/online-user` — 在线用户列表、强制下线

### 8. 缓存监控

- **API**: 概览信息 / Key 搜索 / Key 详情 / 单个删除 / 清空全部
- **页面**: `/monitor/cache` — 缓存用量统计、Key 搜索查看管理
- **支持类型**: string / list / set / hash / zset 的值查看

### 9. 测试框架

- Vitest + @nuxt/test-utils + happy-dom
- `npm run test` / `npm run test:watch`

### 10. 前端门户模块

面向消费者/用户的前端门户，与后台管理分离，访客无需登录即可访问：

- **Portal 布局** `app/layouts/portal.vue` — 简洁顶部导航 + 页脚，无侧边栏，无认证要求
- **Portal 首页** `/portal` — UberEats 风格的美食外送首页，含英雄区、美食分类、餐厅推荐、订餐流程展示
-   **路由规则**: `/**` 重定向到 `/portal`；`/admin/**` 为后台管理页面（需要登录）；`/portal/**` 使用 SSR 渲染（见 `nuxt.config.ts`）
- **设计语言**: UberEats 风格（主色 #06C167），现代化卡片式布局，全响应式
- **样式方案**: Portal 模块统一使用 Tailwind CSS 开发，不使用 `<style scoped>` 或 Element Plus 样式。后台管理页面仍使用 Element Plus + SCSS。
- **i18n 国际化**: Portal 模块使用 `@nuxtjs/i18n`，翻译文件位于 `i18n/locales/`，目前支持 `tw` / `en` / `jp` 三种语言。URL 格式为 `/portal/tw`、`/portal/en`、`/portal/jp`，方便分享和刷新保持语言状态。页脚底部提供语言切换按钮。

## 认证流程

1. POST `/api/auth/login` → JWT token，前端存 `useCookie('token')`，同时回写 Redis 在线记录
2. `server/middleware/auth.ts` 拦截 `/api/*`（白名单除外），注入 `event.context.auth`
3. `app/middleware/auth.ts` 检查 cookie，无 token 跳 `/login`
4. admin 角色绕过所有权限检查

## RBAC

```
目录(type=0) → 菜单(type=1) → 按钮(type=2, code: "system:user:create")
```

## 响应格式

```json
{ "code": 200, "msg": "success", "data": { ... } }
{ "code": 200, "data": { "list": [...], "total": N, "page": 1, "pageSize": 10 } }
{ "statusCode": 401, "message": "..." }
```

## 数据库 (12 表)

已有: `sys_user`, `sys_role`, `sys_permission`, `sys_dict_type`, `sys_dict_data`, `sys_user_role`, `sys_role_permission`, `sys_file`, `sys_category`, `sys_content`
新增: `sys_audit_log`, `sys_notification`
关联表: `sys_user_menu` (用户单独分配菜单)

## 关键约定

- **路由**: Nuxt 4 文件路由（`[id].put.ts` → `/:id` PUT）；后台管理页面统一挂载在 `/admin` 前缀下
- **API 调用**: 优先使用 `useRequest()` composable，统一错误处理
- **页面**: `definePageMeta({ layout: 'admin', middleware: 'auth' })`
- **图标**: `<el-icon><component :is="iconName" /></el-icon>`
- **响应式**: 根容器 `width: 100%`，表格 `overflow-x: auto`
- **Prisma**: 模型前缀 `Sys`，关联表级联删除
- **TS 严格模式**: 启用 `typescript.strict`，禁止 `as any`
- **Portal 样式**: Portal 模块所有页面统一使用 Tailwind CSS utility classes，禁止编写自定义 CSS（不使用 `<style scoped>`）
- **i18n 国际化**: Portal 模块使用 `@nuxtjs/i18n`，翻译文件位于 `i18n/locales/`，目前支持 `tw` / `en` / `jp` 三种语言。URL 格式为 `/portal/tw`、`/portal/en`、`/portal/jp`。
- **文档同步**: 每次新增功能后更新 `.env.example`、`AGENTS.md`、`shared/types/api.ts`

## 开发命令

```bash
npm run dev       # 开发
npm run build     # 构建
npm run seed      # 种子数据
npm run test      # 测试
npx prisma migrate dev --name xxx   # 数据库迁移
```

## 默认管理员

`admin` / `admin123`，超级管理员角色。
