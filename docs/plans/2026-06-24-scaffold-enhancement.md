# 脚手架增强实施计划

> **目标:** 将 admin-app 打磨为通用基础脚手架，后续可快速开发业务模块

**架构原则:** 渐进式增强，每阶段独立可交付，互不阻塞

**实施阶段:**

| 阶段 | 内容 | 依赖 |
|------|------|------|
| **Phase 1** | 共享类型 + 统一 API 封装 + TS 严格模式 | 无 |
| **Phase 2** | 操作审计日志 | Phase 1 (类型) |
| **Phase 3** | 数据导出 (Excel) | Phase 1 (API 封装) |
| **Phase 4** | 通知中心 | Phase 1 (类型) + Phase 2 (审计) |
| **Phase 5** | 测试框架 | Phase 1 (类型) |

---

## Phase 1: 共享类型 + 统一 API 封装 + TS 严格模式

### 1.1 创建共享类型层

**原理:** Nuxt 4 支持 `server/utils/` 中定义的类型自动被 `app/` 侧引用（通过 `.nuxt/tsconfig.server.json`）。我们利用这一机制在 `server/types/` 定义所有 API 接口类型。

**创建:** `server/types/api.ts`

```typescript
// ========== 通用响应类型 ==========
export interface ApiResponse<T = unknown> {
  code: number
  msg?: string
  data: T
}

export interface PaginatedData<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// ========== 用户模块 ==========
export interface UserInfo {
  id: number
  username: string
  nickname: string | null
  email: string | null
  phone: string | null
  avatar: string | null
  status: number
}

export interface UserItem extends UserInfo {
  createTime: string
  updateTime: string
  roles: { id: number; name: string; code: string }[]
}

export interface UserQuery {
  page?: number
  pageSize?: number
  username?: string
  status?: number
}

export interface UserCreateBody {
  username: string
  password: string
  nickname?: string
  email?: string
  phone?: string
  status?: number
  roleIds?: number[]
}

// ========== 角色模块 ==========
export interface RoleItem {
  id: number
  name: string
  code: string
  description: string | null
  status: number
  sort: number
  createTime: string
}

// ========== 权限模块 ==========
export interface PermissionNode {
  id: number
  name: string
  code: string | null
  type: number
  parentId: number | null
  path: string | null
  icon: string | null
  sort: number
  status: number
  visible: number
  children: PermissionNode[]
}

// ========== 字典模块 ==========
export interface DictTypeItem {
  id: number
  name: string
  code: string
  status: number
  createTime: string
}

export interface DictDataItem {
  id: number
  dictTypeId: number
  label: string
  value: string
  sort: number
  status: number
}

// ========== 认证模块 ==========
export interface LoginBody {
  username: string
  password: string
}

export interface LoginResult {
  token: string
  user: UserInfo
}

export interface UserinfoResult {
  user: UserInfo
  roles: string[]
  permissions: string[]
}

export interface MenuNode {
  id: number
  name: string
  code: string | null
  type: number
  path: string | null
  icon: string | null
  sort: number
  visible: number
  children: MenuNode[]
}

// ========== 审计日志模块 ==========
export interface AuditLogItem {
  id: number
  userId: number
  username: string
  action: string
  target: string
  targetId: number | null
  detail: string | null
  ip: string | null
  createTime: string
}

// ========== 通知模块 ==========
export interface NotificationItem {
  id: number
  userId: number
  title: string
  content: string
  type: string // 'system' | 'approval' | 'reminder'
  isRead: number // 0=未读, 1=已读
  createTime: string
}

// ========== 系统监控 ==========
export interface SystemMonitorData {
  uptime: number
  memory: { total: number; used: number; free: number }
  cpu: { load: number }
  os: { hostname: string; platform: string; release: string }
  db: { status: string }
}
```

### 1.2 创建统一 API 封装 composable

**创建:** `app/composables/useRequest.ts`

```typescript
/**
 * 统一 API 请求封装
 *
 * 功能:
 * - 自动携带 token
 * - 统一错误处理 (401 自动跳登录)
 * - 请求/响应拦截器
 * - loading / error 状态
 * - 泛型支持
 */

import type { ApiResponse } from '#shared/types'

interface RequestOptions {
  /** 是否显示错误消息 (默认 true) */
  showError?: boolean
  /** 自定义错误处理 */
  onError?: (err: { code?: number; message: string }) => void
  /** 请求头覆盖 */
  headers?: Record<string, string>
}

export function useRequest() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const token = useCookie('token')

  async function request<T = unknown>(
    url: string,
    opts: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: any; params?: any } & RequestOptions = {}
  ): Promise<T | null> {
    const { showError = true, onError, method = 'GET', body, params, ...rest } = opts
    loading.value = true
    error.value = null

    try {
      const res: ApiResponse<T> = await $fetch(url, {
        method,
        body,
        params,
        headers: { ...rest.headers },
      })
      if (res.code !== 200) {
        const msg = res.msg || '请求失败'
        if (showError) ElMessage.error(msg)
        error.value = msg
        onError?.({ code: res.code, message: msg })
        return null
      }
      return res.data ?? (res as unknown as T)
    } catch (err: any) {
      const msg = err.data?.message || err.message || '网络错误'
      if (showError) ElMessage.error(msg)
      error.value = msg
      onError?.({ message: msg })
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    // 便捷方法
    get: <T>(url: string, opts?: RequestOptions & { params?: any }) => request<T>(url, { ...opts, method: 'GET' }),
    post: <T>(url: string, body?: any, opts?: RequestOptions) => request<T>(url, { ...opts, method: 'POST', body }),
    put: <T>(url: string, body?: any, opts?: RequestOptions) => request<T>(url, { ...opts, method: 'PUT', body }),
    del: <T>(url: string, opts?: RequestOptions) => request<T>(url, { ...opts, method: 'DELETE' }),
  }
}
```

### 1.3 启用 TS 严格模式并修复类型错误

**修改:** `nuxt.config.ts` — 添加 `typescript: { strict: true }` 或通过 `tsconfig.json` 启用

**修复范围:**
- 所有 `as any` 替换为具体类型
- 所有 `ref<any[]>([])` 替换为 `ref<Type[]>([])`
- 所有 `(res: any)` 替换为 `ApiResponse<T>`
- `event: any` 类型修正

**Step:** 在 `nuxt.config.ts` 中添加:
```typescript
typescript: {
  typeCheck: true,
  strict: true,
}
```

然后运行构建找出所有类型错误逐个修复。

### 1.4 在现有页面中使用新 composable 替换裸 $fetch

**涉及页面:**
- `app/stores/auth.ts` — login, fetchUserInfo, fetchMenus
- `app/pages/system/user.vue` — 列表/增/删/改
- `app/pages/system/role.vue`
- `app/pages/system/permission.vue`
- `app/pages/system/dict-type.vue`
- `app/pages/system/category.vue`
- `app/pages/system/content.vue`
- `app/pages/monitor/server.vue`

---

## Phase 2: 操作审计日志

### 2.1 添加 Prisma 模型

**修改:** `prisma/schema.prisma`

```prisma
model SysAuditLog {
  id         Int      @id @default(autoincrement())
  userId     Int      @map("user_id")
  username   String   @db.VarChar(50)
  action     String   @db.VarChar(50)    // CREATE | UPDATE | DELETE | LOGIN | LOGOUT
  target     String   @db.VarChar(50)    // user | role | permission | dict-type | ...
  targetId   Int?     @map("target_id")
  detail     String?  @db.Text           // JSON 存储变更详情
  ip         String?  @db.VarChar(50)
  createTime DateTime @default(now()) @map("create_time")

  @@map("sys_audit_log")
}
```

### 2.2 创建审计日志服务

**创建:** `server/utils/audit.ts`

```typescript
import prisma from './prisma'

interface AuditParams {
  userId: number
  username: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT'
  target: string
  targetId?: number
  detail?: string
  ip?: string
}

export async function writeAuditLog(params: AuditParams) {
  try {
    await prisma.sysAuditLog.create({ data: params })
  } catch (err) {
    console.error('Failed to write audit log:', err)
  }
}

/** 从 event 中提取审计所需的上下文 */
export function getAuditContext(event: any): { userId: number; username: string; ip: string } {
  const auth = event.context.auth || {}
  const ip = getHeader(event, 'x-forwarded-for') || getHeader(event, 'x-real-ip') || ''
  return {
    userId: auth.userId || 0,
    username: auth.username || 'unknown',
    ip,
  }
}
```

### 2.3 创建 Nitro 插件自动记录写操作

**创建:** `server/plugins/audit.ts`

通过 hook 所有 PUT/POST/DELETE 请求，自动记录审计日志。

### 2.4 创建审计日志查询 API

**创建:**
- `server/api/system/audit-log/index.get.ts` — 分页查询审计日志

### 2.5 创建审计日志管理页面 (可选，但建议)

**创建:** `app/pages/system/audit-log.vue` — 查看审计日志列表

---

## Phase 3: 数据导出 (Excel)

### 3.1 安装依赖

```bash
npm install exceljs
npm install -D @types/exceljs  # 如果有类型包
```

### 3.2 创建数据导出 composable

**创建:** `app/composables/useExport.ts`

```typescript
import ExcelJS from 'exceljs'
import type { ApiResponse } from '#shared/types'

interface ExportColumn {
  key: string
  title: string
  width?: number
  /** 值格式化函数 */
  formatter?: (value: any, row: any) => string
}

interface ExportOptions {
  columns: ExportColumn[]
  /** 获取数据函数，返回 flat 数组 */
  fetchData: () => Promise<any[]>
  fileName?: string
  sheetName?: string
}

export function useExport() {
  const exporting = ref(false)

  async function exportExcel(options: ExportOptions) {
    const { columns, fetchData, fileName = 'export.xlsx', sheetName = 'Sheet1' } = options
    exporting.value = true

    try {
      const data = await fetchData()

      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet(sheetName)

      // 表头
      sheet.columns = columns.map(col => ({
        header: col.title,
        key: col.key,
        width: col.width || 20,
      }))

      // 数据行
      data.forEach(row => {
        sheet.addRow(
          Object.fromEntries(
            columns.map(col => {
              const value = row[col.key]
              return [col.key, col.formatter ? col.formatter(value, row) : value ?? '']
            })
          )
        )
      })

      // 生成并下载
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
      ElMessage.error('导出失败')
    } finally {
      exporting.value = false
    }
  }

  return { exporting, exportExcel }
}
```

### 3.3 在现有页面添加导出按钮

**修改:** `app/pages/system/user.vue` — 添加导出按钮并调用

---

## Phase 4: 通知中心

### 4.1 添加 Prisma 模型

**修改:** `prisma/schema.prisma`

```prisma
model SysNotification {
  id         Int      @id @default(autoincrement())
  userId     Int      @map("user_id")      // 0 = 全员通知
  title      String   @db.VarChar(200)
  content    String?  @db.Text
  type       String   @default("system") @db.VarChar(30) // system | approval | reminder
  isRead     Int      @default(0) @map("is_read") // 0=未读, 1=已读
  createTime DateTime @default(now()) @map("create_time")

  @@map("sys_notification")
}
```

### 4.2 创建通知 API

**创建:**
- `server/api/system/notification/index.get.ts` — 当前用户的通知列表
- `server/api/system/notification/unread-count.get.ts` — 未读数量
- `server/api/system/notification/[id]/read.put.ts` — 标记已读
- `server/api/system/notification/read-all.put.ts` — 全部标记已读

### 4.3 创建通知前端组件

**创建:** `app/components/NotificationBell.vue`

在顶栏显示铃铛图标 + 未读数量，点击下拉显示最近通知。

### 4.4 集成到布局

**修改:** `app/layouts/admin.vue` — 在顶栏添加 NotificationBell 组件

### 4.5 创建通知管理页面 (可选)

**创建:** `app/pages/system/notification.vue`

---

## Phase 5: 测试框架

### 5.1 安装依赖

```bash
npm install -D vitest @vue/test-utils happy-dom
```

### 5.2 创建 Vitest 配置

**创建:** `vitest.config.ts`

### 5.3 创建基础测试

**创建:** `tests/server/auth.test.ts` — API 认证流程测试
**创建:** `tests/composables/useRequest.test.ts` — API 封装测试

### 5.4 在 package.json 添加脚本

```json
"test": "vitest run",
"test:watch": "vitest"
```

---

## 执行顺序

```
Phase 1.1 (共享类型) ─┬─→ Phase 1.2 (API 封装) ──→ Phase 1.3 (TS 严格模式) ──→ Phase 1.4 (页面改造)
                      │
                      ├─→ Phase 2 (审计日志) ──────────────────────────────────────────
                      │
                      ├─→ Phase 3 (数据导出) ──────────────────────────────────────────
                      │
                      ├─→ Phase 4 (通知中心) ──────────────────────────────────────────
                      │
                      └─→ Phase 5 (测试框架) ──────────────────────────────────────────
```

Phase 1.1 是唯一阻塞项，完成后 Phase 2-5 可以并行执行。
