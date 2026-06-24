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
  remark?: string
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
  type: 'system' | 'approval' | 'reminder'
  isRead: number
  createTime: string
}

// ========== 系统监控 ==========
export interface SystemMonitorData {
  uptime: number
  osUptime: number
  memory: {
    rss: number
    heapTotal: number
    heapUsed: number
    external: number
    total: number
    free: number
    usagePercent: string
  } | null
  cpu: { cores: number; model: string; arch: string; loadAvg: number[] } | null
  os: { hostname: string; platform: string; release: string } | null
  runtime: { nodeVersion: string; pid: number; cwd: string } | null
  database: { status: string; version: string } | null
}

// ========== 文件模块 ==========
export interface FileRecord {
  id: number
  fileName: string
  storageName: string
  filePath: string
  fileSize: number
  fileType: string | null
  extension: string | null
  module: string | null
  uploadBy: number | null
  status: number
  createTime: string
  updateTime: string
}

// ========== 内容模块 ==========
export interface CategoryItem {
  id: number
  name: string
  code: string
  description: string | null
  sort: number
  status: number
}

export interface ContentItem {
  id: number
  title: string
  thumbnail: string | null
  summary: string | null
  categoryId: number | null
  status: number
  createTime: string
}
