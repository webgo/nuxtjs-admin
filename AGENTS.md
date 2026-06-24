# Admin App — 通用基础脚手架

Nuxt 4 后台管理系统（RuoYi 风格），定位为通用基础开发脚手架，用于快速搭建业务模块。

## Tech Stack

| 层 | 技术 |
|---|---|
| 框架 | Nuxt 4 (Vue 3 + Vite + Nitro) |
| UI | Element Plus |
| ORM | Prisma 7 + MariaDB Adapter |
| 数据库 | MySQL 8.0 |
| 认证 | JWT (jsonwebtoken + bcryptjs) |
| 测试 | Vitest + @nuxt/test-utils |
| 导出 | ExcelJS |
| 语言 | TypeScript (strict mode) |

## 目录结构

```
shared/types/api.ts       前后端共享类型定义
prisma/                   schema.prisma (10 表) + seed.ts + migrations
server/
  middleware/auth.ts      全局 JWT 认证中间件
  plugins/audit.ts        Nitro 插件，自动记录写操作审计日志
  utils/                  prisma.ts, jwt.ts, audit.ts, fileStorage.ts
  api/auth/               登录/登出/用户信息/菜单
  api/system/             user/role/permission/dict-type/dict-data/...
                          category/content/file/monitor/audit-log/notification
app/
  layouts/admin.vue       侧边栏+顶栏布局（含通知铃铛）
  components/             RichTextEditor, NotificationBell
  composables/            useRequest(统一API), useFileUpload, useExport(Excel)
  middleware/auth.ts      客户端路由守卫
  stores/auth.ts          Pinia 认证仓库
  pages/                  各功能页面
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

### 6. 测试框架

- Vitest + @nuxt/test-utils + happy-dom
- `npm run test` / `npm run test:watch`

## 认证流程

1. POST `/api/auth/login` → JWT token，前端存 `useCookie('token')`
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

## 数据库 (10 表)

已有: `sys_user`, `sys_role`, `sys_permission`, `sys_dict_type`, `sys_dict_data`, `sys_user_role`, `sys_role_permission`, `sys_file`, `sys_category`, `sys_content`
新增: `sys_audit_log`, `sys_notification`
关联表: `sys_user_menu` (用户单独分配菜单)

## 关键约定

- **路由**: Nuxt 4 文件路由（`[id].put.ts` → `/:id` PUT）
- **API 调用**: 优先使用 `useRequest()` composable，统一错误处理
- **页面**: `definePageMeta({ layout: 'admin', middleware: 'auth' })`
- **图标**: `<el-icon><component :is="iconName" /></el-icon>`
- **响应式**: 根容器 `width: 100%`，表格 `overflow-x: auto`
- **Prisma**: 模型前缀 `Sys`，关联表级联删除
- **TS 严格模式**: 启用 `typescript.strict`，禁止 `as any`

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
