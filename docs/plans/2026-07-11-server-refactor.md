# Server-Side Architecture Refactoring Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extract business logic from 98 API route files into a service layer, restructure API routes by consumer context (admin/portal/shared), and add comprehensive tests.

**Architecture:** 
- Service layer (`server/services/`) encapsulates all business logic with explicit imports
- API routes (`server/api/`) become thin controllers handling only input/output
- Shared utilities (`server/utils/`) provide auto-imported helpers for pagination, response building, and query parsing
- API routes reorganized: `admin/*` (后台管理), `portal/*` (前台门户), `cart/*`, `order/*`, `rating/*` (独立业务)

**Tech Stack:** Nuxt 4, Nitro, Prisma 7, TypeScript strict mode, Vitest

---

## Phase 1: Utility Infrastructure

### Task 1.1: Create Response Utility

**Files:**
- Create: `server/utils/response.ts`

**Step 1: Write implementation**

```typescript
// server/utils/response.ts
import type { ApiResponse } from '#shared/types/api'

export function success<T>(data: T, msg = 'success'): ApiResponse<T> {
  return { code: 200, msg, data }
}

export function fail(msg: string, code = 500): ApiResponse<null> {
  return { code, msg, data: null }
}

export function paginate<T>(
  list: T[],
  total: number,
  page: number,
  pageSize: number,
) {
  return success({ list, total, page, pageSize })
}
```

**Step 2: Verify auto-import works**

Run: `npx nuxi typecheck`
Expected: No errors

---

### Task 1.2: Create Pagination Utility

**Files:**
- Create: `server/utils/pagination.ts`

**Step 1: Write implementation**

```typescript
// server/utils/pagination.ts
import type { H3Event } from 'h3'

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

export function paginateArgs(params: PaginationParams) {
  return {
    skip: (params.page - 1) * params.pageSize,
    take: params.pageSize,
  }
}
```

**Step 2: Verify auto-import works**

Run: `npx nuxi typecheck`
Expected: No errors

---

### Task 1.3: Create Query Utility

**Files:**
- Create: `server/utils/query.ts`

**Step 1: Write implementation**

```typescript
// server/utils/query.ts
import type { H3Event } from 'h3'
import { getQuery } from 'h3'

export function stringParam(query: Record<string, unknown>, key: string): string | undefined {
  const val = query[key]
  if (typeof val === 'string' && val.trim()) return val.trim()
  return undefined
}

export function numberParam(query: Record<string, unknown>, key: string): number | undefined {
  const val = query[key]
  if (val !== undefined && val !== null && val !== '') {
    const num = Number(val)
    if (!isNaN(num)) return num
  }
  return undefined
}

export function requiredString(body: Record<string, unknown>, key: string, fieldName: string): string {
  const val = body[key]
  if (typeof val === 'string' && val.trim()) return val.trim()
  throw createError({ statusCode: 400, message: `${fieldName}不能为空` })
}

export function requiredNumber(body: Record<string, unknown>, key: string, fieldName: string): number {
  const val = body[key]
  if (val !== undefined && val !== null && val !== '') {
    const num = Number(val)
    if (!isNaN(num)) return num
  }
  throw createError({ statusCode: 400, message: `${fieldName}不能为空` })
}
```

**Step 2: Verify auto-import works**

Run: `npx nuxi typecheck`
Expected: No errors

---

## Phase 2: Service Layer

### Task 2.1: Create Auth Service

**Files:**
- Create: `server/services/auth.service.ts`

**Step 1: Write implementation**

```typescript
// server/services/auth.service.ts
import bcrypt from 'bcryptjs'
import prisma from '../utils/prisma'
import { signToken } from '../utils/jwt'
import { setItem } from '../utils/storage'

interface LoginParams {
  username: string
  password: string
  userType: 1 | 0  // 1=admin, 0=portal
  ip?: string
}

interface LoginResult {
  token: string
  user: {
    id: number
    username: string
    nickname: string | null
    email: string
    phone: string | null
    avatar: string | null
    status: number
    userType: number
  }
}

export const authService = {
  async login(params: LoginParams): Promise<LoginResult> {
    const { username, password, userType, ip } = params

    const user = await prisma.sysUser.findUnique({ where: { username } })
    if (!user) {
      throw createError({ statusCode: 401, message: '用户名或密码错误' })
    }

    if (user.status === 0) {
      throw createError({ statusCode: 403, message: '账号已被禁用，请联系管理员' })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      throw createError({ statusCode: 401, message: '用户名或密码错误' })
    }

    const token = signToken({ userId: user.id, username: user.username, userType })

    // 写入在线用户记录
    const prefix = userType === 1 ? 'admin' : 'portal'
    try {
      const onlineData = {
        userId: user.id,
        username: user.username,
        nickname: user.nickname,
        ip: ip || '',
        loginTime: new Date().toISOString(),
        token,
      }
      const ttl = 60 * 60 * 24
      await setItem(`${prefix}_online_user:${user.id}`, onlineData, { ttl })
      await setItem(`${prefix}_online_token:${token}`, String(user.id), { ttl })
    } catch (err) {
      console.warn('[Auth] online user record failed:', (err as Error).message)
    }

    // 创建欢迎通知（仅后台用户）
    if (userType === 1) {
      try {
        await prisma.sysNotification.create({
          data: {
            userId: user.id,
            title: '欢迎回来！',
            content: `${user.nickname || user.username}，您已于 ${new Date().toLocaleString('zh-CN')} 成功登录系统。`,
            type: 'system',
          },
        })
      } catch {
        // 通知创建失败不影响登录
      }
    }

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        status: user.status,
        userType: user.userType,
      },
    }
  },

  async register(params: {
    username: string
    email: string
    password: string
    nickname?: string
    phone?: string
    ip?: string
  }): Promise<LoginResult> {
    const { username, email, password, nickname, phone, ip } = params

    // 验证
    if (username.length < 2 || username.length > 20) {
      throw createError({ statusCode: 400, message: '用户名长度需在 2-20 个字符之间' })
    }
    if (password.length < 6) {
      throw createError({ statusCode: 400, message: '密码长度不能少于 6 个字符' })
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw createError({ statusCode: 400, message: '邮箱格式不正确' })
    }

    // 检查重复
    const existingUsername = await prisma.sysUser.findUnique({ where: { username } })
    if (existingUsername) {
      throw createError({ statusCode: 409, message: '用户名已被注册' })
    }
    const existingEmail = await prisma.sysUser.findFirst({ where: { email } })
    if (existingEmail) {
      throw createError({ statusCode: 409, message: '邮箱已被注册' })
    }

    // 创建用户
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.sysUser.create({
      data: {
        username,
        email,
        password: hashedPassword,
        nickname: nickname || username,
        phone: phone || null,
        userType: 0,
        status: 1,
      },
    })

    const token = signToken({ userId: user.id, username: user.username, userType: 0 })

    // 写入在线记录
    try {
      const onlineData = {
        userId: user.id,
        username: user.username,
        nickname: user.nickname,
        ip: ip || '',
        loginTime: new Date().toISOString(),
        token,
      }
      const ttl = 60 * 60 * 24
      await setItem(`portal_online_user:${user.id}`, onlineData, { ttl })
      await setItem(`portal_online_token:${token}`, String(user.id), { ttl })
    } catch (err) {
      console.warn('[Auth] online user record failed:', (err as Error).message)
    }

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        status: user.status,
        userType: user.userType,
      },
    }
  },

  async getUserInfo(userId: number) {
    const user = await prisma.sysUser.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: { role: true },
        },
      },
    })
    if (!user) {
      throw createError({ statusCode: 404, message: '用户不存在' })
    }
    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      status: user.status,
      userType: user.userType,
      roles: user.roles.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
        code: ur.role.code,
      })),
    }
  },

  async updateProfile(userId: number, data: { nickname?: string; email?: string; phone?: string }) {
    const user = await prisma.sysUser.update({
      where: { id: userId },
      data,
    })
    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
    }
  },

  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    const user = await prisma.sysUser.findUnique({ where: { id: userId } })
    if (!user) {
      throw createError({ statusCode: 404, message: '用户不存在' })
    }

    const valid = await bcrypt.compare(oldPassword, user.password)
    if (!valid) {
      throw createError({ statusCode: 400, message: '旧密码不正确' })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await prisma.sysUser.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    return true
  },
}
```

**Step 2: Verify typecheck**

Run: `npx nuxi typecheck`
Expected: No errors

---

### Task 2.2: Create User Service

**Files:**
- Create: `server/services/user.service.ts`

**Step 1: Write implementation**

```typescript
// server/services/user.service.ts
import bcrypt from 'bcryptjs'
import prisma from '../utils/prisma'

interface UserListParams {
  page: number
  pageSize: number
  username?: string
  status?: number
}

interface UserCreateParams {
  username: string
  nickname?: string
  email?: string
  phone?: string
  password: string
  status?: number
  remark?: string
  roleIds?: number[]
}

interface UserUpdateParams {
  nickname?: string
  email?: string
  phone?: string
  status?: number
  remark?: string
  roleIds?: number[]
}

export const userService = {
  async list(params: UserListParams) {
    const { page, pageSize, username, status } = params

    const where: Record<string, unknown> = {}
    if (username) where.username = { contains: username }
    if (status !== undefined) where.status = status

    const [rows, total] = await Promise.all([
      prisma.sysUser.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createTime: 'desc' },
        include: {
          roles: {
            include: { role: true },
          },
        },
      }),
      prisma.sysUser.count({ where }),
    ])

    const list = rows.map(u => ({
      id: u.id,
      username: u.username,
      nickname: u.nickname,
      email: u.email,
      phone: u.phone,
      avatar: u.avatar,
      status: u.status,
      remark: u.remark,
      createTime: u.createTime,
      updateTime: u.updateTime,
      roles: u.roles.map(ur => ({ id: ur.role.id, name: ur.role.name, code: ur.role.code })),
    }))

    return { list, total, page, pageSize }
  },

  async findById(id: number) {
    const user = await prisma.sysUser.findUnique({
      where: { id },
      include: {
        roles: {
          include: { role: true },
        },
      },
    })
    if (!user) {
      throw createError({ statusCode: 404, message: '用户不存在' })
    }
    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      status: user.status,
      remark: user.remark,
      createTime: user.createTime,
      updateTime: user.updateTime,
      roles: user.roles.map(ur => ({ id: ur.role.id, name: ur.role.name, code: ur.role.code })),
    }
  },

  async create(params: UserCreateParams) {
    const { username, nickname, email, phone, password, status, remark, roleIds } = params

    // 检查用户名唯一
    const existing = await prisma.sysUser.findUnique({ where: { username } })
    if (existing) {
      throw createError({ statusCode: 409, message: '用户名已存在' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.sysUser.create({
      data: {
        username,
        nickname: nickname || username,
        email: email || `${username}@placeholder.com`,
        phone: phone || null,
        password: hashedPassword,
        status: status ?? 1,
        remark: remark || null,
        userType: 1,
        roles: roleIds?.length ? {
          create: roleIds.map(roleId => ({ roleId })),
        } : undefined,
      },
      include: {
        roles: true,
      },
    })

    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      status: user.status,
      createTime: user.createTime,
    }
  },

  async update(id: number, params: UserUpdateParams) {
    const { nickname, email, phone, status, remark, roleIds } = params

    const user = await prisma.sysUser.findUnique({ where: { id } })
    if (!user) {
      throw createError({ statusCode: 404, message: '用户不存在' })
    }

    // 更新用户基本信息
    await prisma.sysUser.update({
      where: { id },
      data: {
        nickname: nickname ?? undefined,
        email: email ?? undefined,
        phone: phone ?? undefined,
        status: status ?? undefined,
        remark: remark ?? undefined,
      },
    })

    // 更新角色关联
    if (roleIds !== undefined) {
      await prisma.sysUserRole.deleteMany({ where: { userId: id } })
      if (roleIds.length > 0) {
        await prisma.sysUserRole.createMany({
          data: roleIds.map(roleId => ({ userId: id, roleId })),
        })
      }
    }

    return this.findById(id)
  },

  async delete(id: number) {
    const user = await prisma.sysUser.findUnique({ where: { id } })
    if (!user) {
      throw createError({ statusCode: 404, message: '用户不存在' })
    }
    if (user.username === 'admin') {
      throw createError({ statusCode: 400, message: '不能删除超级管理员' })
    }

    await prisma.sysUserRole.deleteMany({ where: { userId: id } })
    await prisma.sysUser.delete({ where: { id } })
    return true
  },

  async updateAvatar(userId: number, avatarUrl: string) {
    await prisma.sysUser.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
    })
    return { avatar: avatarUrl }
  },
}
```

**Step 2: Verify typecheck**

Run: `npx nuxi typecheck`
Expected: No errors

---

### Task 2.3: Create Role Service

**Files:**
- Create: `server/services/role.service.ts`

**Step 1: Write implementation**

```typescript
// server/services/role.service.ts
import prisma from '../utils/prisma'

interface RoleListParams {
  page: number
  pageSize: number
  name?: string
  code?: string
  status?: number
}

interface RoleCreateParams {
  name: string
  code: string
  description?: string
  status?: number
  sort?: number
  remark?: string
  permissionIds?: number[]
}

interface RoleUpdateParams {
  name?: string
  code?: string
  description?: string
  status?: number
  sort?: number
  remark?: string
  permissionIds?: number[]
}

export const roleService = {
  async list(params: RoleListParams) {
    const { page, pageSize, name, code, status } = params

    const where: Record<string, unknown> = {}
    if (name) where.name = { contains: name }
    if (code) where.code = { contains: code }
    if (status !== undefined) where.status = status

    const [rows, total] = await Promise.all([
      prisma.sysRole.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { sort: 'asc' },
        include: {
          _count: { select: { users: true } },
        },
      }),
      prisma.sysRole.count({ where }),
    ])

    const list = rows.map(r => ({
      id: r.id,
      name: r.name,
      code: r.code,
      description: r.description,
      status: r.status,
      sort: r.sort,
      remark: r.remark,
      createTime: r.createTime,
      updateTime: r.updateTime,
      userCount: r._count.users,
    }))

    return { list, total, page, pageSize }
  },

  async findAll() {
    return prisma.sysRole.findMany({
      where: { status: 1 },
      orderBy: { sort: 'asc' },
      select: { id: true, name: true, code: true },
    })
  },

  async findById(id: number) {
    const role = await prisma.sysRole.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    })
    if (!role) {
      throw createError({ statusCode: 404, message: '角色不存在' })
    }
    return {
      id: role.id,
      name: role.name,
      code: role.code,
      description: role.description,
      status: role.status,
      sort: role.sort,
      remark: role.remark,
      createTime: role.createTime,
      updateTime: role.updateTime,
      permissionIds: role.permissions.map(rp => rp.permissionId),
    }
  },

  async create(params: RoleCreateParams) {
    const { name, code, description, status, sort, remark, permissionIds } = params

    // 检查角色编码唯一
    const existing = await prisma.sysRole.findUnique({ where: { code } })
    if (existing) {
      throw createError({ statusCode: 409, message: '角色编码已存在' })
    }

    const role = await prisma.sysRole.create({
      data: {
        name,
        code,
        description: description || null,
        status: status ?? 1,
        sort: sort ?? 0,
        remark: remark || null,
        permissions: permissionIds?.length ? {
          create: permissionIds.map(permissionId => ({ permissionId })),
        } : undefined,
      },
    })

    return { id: role.id, name: role.name, code: role.code }
  },

  async update(id: number, params: RoleUpdateParams) {
    const { name, code, description, status, sort, remark, permissionIds } = params

    const role = await prisma.sysRole.findUnique({ where: { id } })
    if (!role) {
      throw createError({ statusCode: 404, message: '角色不存在' })
    }

    // 检查角色编码唯一（排除自身）
    if (code && code !== role.code) {
      const existing = await prisma.sysRole.findUnique({ where: { code } })
      if (existing) {
        throw createError({ statusCode: 409, message: '角色编码已存在' })
      }
    }

    await prisma.sysRole.update({
      where: { id },
      data: {
        name: name ?? undefined,
        code: code ?? undefined,
        description: description ?? undefined,
        status: status ?? undefined,
        sort: sort ?? undefined,
        remark: remark ?? undefined,
      },
    })

    // 更新权限关联
    if (permissionIds !== undefined) {
      await prisma.sysRolePermission.deleteMany({ where: { roleId: id } })
      if (permissionIds.length > 0) {
        await prisma.sysRolePermission.createMany({
          data: permissionIds.map(permissionId => ({ roleId: id, permissionId })),
        })
      }
    }

    return this.findById(id)
  },

  async delete(id: number) {
    const role = await prisma.sysRole.findUnique({ where: { id } })
    if (!role) {
      throw createError({ statusCode: 404, message: '角色不存在' })
    }

    // 检查是否有用户使用此角色
    const userCount = await prisma.sysUserRole.count({ where: { roleId: id } })
    if (userCount > 0) {
      throw createError({ statusCode: 400, message: '该角色下有用户，不能删除' })
    }

    await prisma.sysRolePermission.deleteMany({ where: { roleId: id } })
    await prisma.sysRole.delete({ where: { id } })
    return true
  },
}
```

**Step 2: Verify typecheck**

Run: `npx nuxi typecheck`
Expected: No errors

---

### Task 2.4: Create Permission Service

**Files:**
- Create: `server/services/permission.service.ts`

**Step 1: Write implementation**

```typescript
// server/services/permission.service.ts
import prisma from '../utils/prisma'

interface PermissionCreateParams {
  parentId: number | null
  name: string
  type: 0 | 1 | 2  // 0=目录, 1=菜单, 2=按钮
  path?: string
  component?: string
  code?: string
  icon?: string
  status?: number
  sort?: number
}

interface PermissionUpdateParams extends Partial<PermissionCreateParams> {}

export const permissionService = {
  async tree() {
    const permissions = await prisma.sysPermission.findMany({
      orderBy: { sort: 'asc' },
    })

    // 构建树结构
    const map = new Map<number, PermissionNode & { children: PermissionNode[] }>()
    const roots: PermissionNode[] = []

    for (const p of permissions) {
      map.set(p.id, { ...p, children: [] })
    }

    for (const p of permissions) {
      const node = map.get(p.id)!
      if (p.parentId && map.has(p.parentId)) {
        map.get(p.parentId)!.children.push(node)
      } else {
        roots.push(node)
      }
    }

    return roots
  },

  async findById(id: number) {
    const permission = await prisma.sysPermission.findUnique({ where: { id } })
    if (!permission) {
      throw createError({ statusCode: 404, message: '权限不存在' })
    }
    return permission
  },

  async create(params: PermissionCreateParams) {
    const { parentId, name, type, path, component, code, icon, status, sort } = params

    // 验证父节点
    if (parentId) {
      const parent = await prisma.sysPermission.findUnique({ where: { id: parentId } })
      if (!parent) {
        throw createError({ statusCode: 400, message: '父权限不存在' })
      }
    }

    // 检查按钮权限编码唯一
    if (type === 2 && code) {
      const existing = await prisma.sysPermission.findFirst({ where: { code, type: 2 } })
      if (existing) {
        throw createError({ statusCode: 409, message: '权限编码已存在' })
      }
    }

    const permission = await prisma.sysPermission.create({
      data: {
        parentId: parentId || null,
        name,
        type,
        path: path || null,
        component: component || null,
        code: code || null,
        icon: icon || null,
        status: status ?? 1,
        sort: sort ?? 0,
      },
    })

    return permission
  },

  async update(id: number, params: PermissionUpdateParams) {
    const { parentId, name, type, path, component, code, icon, status, sort } = params

    const permission = await prisma.sysPermission.findUnique({ where: { id } })
    if (!permission) {
      throw createError({ statusCode: 404, message: '权限不存在' })
    }

    // 不能将自己设为自己的子节点
    if (parentId === id) {
      throw createError({ statusCode: 400, message: '不能将自己设为自己的子节点' })
    }

    await prisma.sysPermission.update({
      where: { id },
      data: {
        parentId: parentId ?? undefined,
        name: name ?? undefined,
        type: type ?? undefined,
        path: path ?? undefined,
        component: component ?? undefined,
        code: code ?? undefined,
        icon: icon ?? undefined,
        status: status ?? undefined,
        sort: sort ?? undefined,
      },
    })

    return this.findById(id)
  },

  async delete(id: number) {
    const permission = await prisma.sysPermission.findUnique({ where: { id } })
    if (!permission) {
      throw createError({ statusCode: 404, message: '权限不存在' })
    }

    // 检查是否有子节点
    const childCount = await prisma.sysPermission.count({ where: { parentId: id } })
    if (childCount > 0) {
      throw createError({ statusCode: 400, message: '该权限下有子节点，不能删除' })
    }

    // 删除角色关联
    await prisma.sysRolePermission.deleteMany({ where: { permissionId: id } })
    await prisma.sysPermission.delete({ where: { id } })
    return true
  },

  async getMenus(userId: number) {
    // 获取用户角色
    const userRoles = await prisma.sysUserRole.findMany({
      where: { userId },
      include: { role: true },
    })

    const roleIds = userRoles.map(ur => ur.roleId)

    // admin 角色拥有所有权限
    const isAdmin = userRoles.some(ur => ur.role.code === 'admin')
    if (isAdmin) {
      return prisma.sysPermission.findMany({
        where: { status: 1, type: { in: [0, 1] } },
        orderBy: { sort: 'asc' },
      })
    }

    // 获取角色关联的权限
    const rolePermissions = await prisma.sysRolePermission.findMany({
      where: { roleId: { in: roleIds } },
      include: { permission: true },
    })

    const permissionIds = [...new Set(rolePermissions.map(rp => rp.permissionId))]

    return prisma.sysPermission.findMany({
      where: { id: { in: permissionIds }, status: 1, type: { in: [0, 1] } },
      orderBy: { sort: 'asc' },
    })
  },

  async getButtonPermissions(userId: number) {
    const userRoles = await prisma.sysUserRole.findMany({
      where: { userId },
      include: { role: true },
    })

    const isAdmin = userRoles.some(ur => ur.role.code === 'admin')
    if (isAdmin) {
      return prisma.sysPermission.findMany({
        where: { status: 1, type: 2 },
        select: { code: true },
      })
    }

    const roleIds = userRoles.map(ur => ur.roleId)
    const rolePermissions = await prisma.sysRolePermission.findMany({
      where: { roleId: { in: roleIds } },
      include: { permission: true },
    })

    const permissionIds = [...new Set(rolePermissions.map(rp => rp.permissionId))]

    return prisma.sysPermission.findMany({
      where: { id: { in: permissionIds }, status: 1, type: 2 },
      select: { code: true },
    })
  },
}

interface PermissionNode {
  id: number
  parentId: number | null
  name: string
  type: number
  path: string | null
  component: string | null
  code: string | null
  icon: string | null
  status: number
  sort: number
  children: PermissionNode[]
}
```

**Step 2: Verify typecheck**

Run: `npx nuxi typecheck`
Expected: No errors

---

### Task 2.5: Create Dict Service

**Files:**
- Create: `server/services/dict.service.ts`

**Step 1: Write implementation**

```typescript
// server/services/dict.service.ts
import prisma from '../utils/prisma'

interface DictTypeListParams {
  page: number
  pageSize: number
  name?: string
  code?: string
  status?: number
}

interface DictTypeCreateParams {
  name: string
  code: string
  description?: string
  status?: number
}

interface DictDataCreateParams {
  dictTypeId: number
  label: string
  value: string
  sort?: number
  status?: number
  remark?: string
}

export const dictService = {
  // 字典类型
  async typeList(params: DictTypeListParams) {
    const { page, pageSize, name, code, status } = params

    const where: Record<string, unknown> = {}
    if (name) where.name = { contains: name }
    if (code) where.code = { contains: code }
    if (status !== undefined) where.status = status

    const [rows, total] = await Promise.all([
      prisma.sysDictType.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createTime: 'desc' },
        include: {
          _count: { select: { dictData: true } },
        },
      }),
      prisma.sysDictType.count({ where }),
    ])

    const list = rows.map(d => ({
      id: d.id,
      name: d.name,
      code: d.code,
      description: d.description,
      status: d.status,
      createTime: d.createTime,
      updateTime: d.updateTime,
      dataCount: d._count.dictData,
    }))

    return { list, total, page, pageSize }
  },

  async typeFindById(id: number) {
    const dictType = await prisma.sysDictType.findUnique({ where: { id } })
    if (!dictType) {
      throw createError({ statusCode: 404, message: '字典类型不存在' })
    }
    return dictType
  },

  async typeCreate(params: DictTypeCreateParams) {
    const existing = await prisma.sysDictType.findUnique({ where: { code: params.code } })
    if (existing) {
      throw createError({ statusCode: 409, message: '字典类型编码已存在' })
    }

    const dictType = await prisma.sysDictType.create({ data: params })
    return dictType
  },

  async typeUpdate(id: number, params: Partial<DictTypeCreateParams>) {
    const dictType = await prisma.sysDictType.findUnique({ where: { id } })
    if (!dictType) {
      throw createError({ statusCode: 404, message: '字典类型不存在' })
    }

    if (params.code && params.code !== dictType.code) {
      const existing = await prisma.sysDictType.findUnique({ where: { code: params.code } })
      if (existing) {
        throw createError({ statusCode: 409, message: '字典类型编码已存在' })
      }
    }

    await prisma.sysDictType.update({
      where: { id },
      data: params,
    })

    return this.typeFindById(id)
  },

  async typeDelete(id: number) {
    const dictType = await prisma.sysDictType.findUnique({ where: { id } })
    if (!dictType) {
      throw createError({ statusCode: 404, message: '字典类型不存在' })
    }

    await prisma.sysDictData.deleteMany({ where: { dictTypeId: id } })
    await prisma.sysDictType.delete({ where: { id } })
    return true
  },

  // 字典数据
  async dataList(dictTypeId: number) {
    return prisma.sysDictData.findMany({
      where: { dictTypeId },
      orderBy: { sort: 'asc' },
    })
  },

  async dataFindById(id: number) {
    const dictData = await prisma.sysDictData.findUnique({ where: { id } })
    if (!dictData) {
      throw createError({ statusCode: 404, message: '字典数据不存在' })
    }
    return dictData
  },

  async dataCreate(params: DictDataCreateParams) {
    const dictData = await prisma.sysDictData.create({ data: params })
    return dictData
  },

  async dataUpdate(id: number, params: Partial<DictDataCreateParams>) {
    const dictData = await prisma.sysDictData.findUnique({ where: { id } })
    if (!dictData) {
      throw createError({ statusCode: 404, message: '字典数据不存在' })
    }

    await prisma.sysDictData.update({
      where: { id },
      data: params,
    })

    return this.dataFindById(id)
  },

  async dataDelete(id: number) {
    const dictData = await prisma.sysDictData.findUnique({ where: { id } })
    if (!dictData) {
      throw createError({ statusCode: 404, message: '字典数据不存在' })
    }

    await prisma.sysDictData.delete({ where: { id } })
    return true
  },

  // 按类型编码查询字典数据
  async getDataByTypeCode(code: string) {
    const dictType = await prisma.sysDictType.findUnique({
      where: { code },
      include: {
        dictData: {
          where: { status: 1 },
          orderBy: { sort: 'asc' },
        },
      },
    })

    if (!dictType) {
      return []
    }

    return dictType.dictData
  },
}
```

**Step 2: Verify typecheck**

Run: `npx nuxi typecheck`
Expected: No errors

---

### Task 2.6: Create Category Service

**Files:**
- Create: `server/services/category.service.ts`

**Step 1: Write implementation**

```typescript
// server/services/category.service.ts
import prisma from '../utils/prisma'

interface CategoryCreateParams {
  name: string
  type: 'content' | 'merchant' | 'product'
  parentId?: number | null
  description?: string
  icon?: string
  sort?: number
  status?: number
}

interface CategoryUpdateParams extends Partial<CategoryCreateParams> {}

export const categoryService = {
  async list(type: string) {
    const where: Record<string, unknown> = {}
    if (type) where.type = type

    const categories = await prisma.sysCategory.findMany({
      where,
      orderBy: { sort: 'asc' },
    })

    // 构建树结构
    const map = new Map<number, CategoryNode & { children: CategoryNode[] }>()
    const roots: CategoryNode[] = []

    for (const c of categories) {
      map.set(c.id, { ...c, children: [] })
    }

    for (const c of categories) {
      const node = map.get(c.id)!
      if (c.parentId && map.has(c.parentId)) {
        map.get(c.parentId)!.children.push(node)
      } else {
        roots.push(node)
      }
    }

    return roots
  },

  async findById(id: number) {
    const category = await prisma.sysCategory.findUnique({ where: { id } })
    if (!category) {
      throw createError({ statusCode: 404, message: '分类不存在' })
    }
    return category
  },

  async create(params: CategoryCreateParams) {
    const { name, type, parentId, description, icon, sort, status } = params

    if (parentId) {
      const parent = await prisma.sysCategory.findUnique({ where: { id: parentId } })
      if (!parent) {
        throw createError({ statusCode: 400, message: '父分类不存在' })
      }
    }

    const category = await prisma.sysCategory.create({
      data: {
        name,
        type,
        parentId: parentId || null,
        description: description || null,
        icon: icon || null,
        sort: sort ?? 0,
        status: status ?? 1,
      },
    })

    return category
  },

  async update(id: number, params: CategoryUpdateParams) {
    const category = await prisma.sysCategory.findUnique({ where: { id } })
    if (!category) {
      throw createError({ statusCode: 404, message: '分类不存在' })
    }

    if (params.parentId === id) {
      throw createError({ statusCode: 400, message: '不能将自己设为自己的父分类' })
    }

    await prisma.sysCategory.update({
      where: { id },
      data: params,
    })

    return this.findById(id)
  },

  async delete(id: number) {
    const category = await prisma.sysCategory.findUnique({ where: { id } })
    if (!category) {
      throw createError({ statusCode: 404, message: '分类不存在' })
    }

    // 检查是否有子分类
    const childCount = await prisma.sysCategory.count({ where: { parentId: id } })
    if (childCount > 0) {
      throw createError({ statusCode: 400, message: '该分类下有子分类，不能删除' })
    }

    // 检查是否有关联的商家/商品
    if (category.type === 'merchant') {
      const merchantCount = await prisma.sysMerchant.count({ where: { categoryId: id } })
      if (merchantCount > 0) {
        throw createError({ statusCode: 400, message: '该分类下有商家，不能删除' })
      }
    }

    await prisma.sysCategory.delete({ where: { id } })
    return true
  },
}

interface CategoryNode {
  id: number
  name: string
  type: string
  parentId: number | null
  description: string | null
  icon: string | null
  sort: number
  status: number
  children: CategoryNode[]
}
```

**Step 2: Verify typecheck**

Run: `npx nuxi typecheck`
Expected: No errors

---

### Task 2.7: Create Content Service

**Files:**
- Create: `server/services/content.service.ts`

**Step 1: Write implementation**

```typescript
// server/services/content.service.ts
import prisma from '../utils/prisma'

interface ContentListParams {
  page: number
  pageSize: number
  title?: string
  categoryId?: number
  status?: number
}

interface ContentCreateParams {
  title: string
  categoryId?: number
  summary?: string
  content: string
  coverImage?: string
  author?: string
  status?: number
  sort?: number
}

interface ContentUpdateParams extends Partial<ContentCreateParams> {}

export const contentService = {
  async list(params: ContentListParams) {
    const { page, pageSize, title, categoryId, status } = params

    const where: Record<string, unknown> = {}
    if (title) where.title = { contains: title }
    if (categoryId !== undefined) where.categoryId = categoryId
    if (status !== undefined) where.status = status

    const [rows, total] = await Promise.all([
      prisma.sysContent.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { sort: 'asc' },
        include: {
          category: { select: { id: true, name: true } },
        },
      }),
      prisma.sysContent.count({ where }),
    ])

    const list = rows.map(c => ({
      id: c.id,
      title: c.title,
      categoryId: c.categoryId,
      categoryName: c.category?.name,
      summary: c.summary,
      content: c.content,
      coverImage: c.coverImage,
      author: c.author,
      status: c.status,
      sort: c.sort,
      viewCount: c.viewCount,
      createTime: c.createTime,
      updateTime: c.updateTime,
    }))

    return { list, total, page, pageSize }
  },

  async findById(id: number) {
    const content = await prisma.sysContent.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
      },
    })
    if (!content) {
      throw createError({ statusCode: 404, message: '内容不存在' })
    }
    return content
  },

  async create(params: ContentCreateParams) {
    const content = await prisma.sysContent.create({
      data: {
        title: params.title,
        categoryId: params.categoryId || null,
        summary: params.summary || null,
        content: params.content,
        coverImage: params.coverImage || null,
        author: params.author || null,
        status: params.status ?? 1,
        sort: params.sort ?? 0,
      },
    })
    return content
  },

  async update(id: number, params: ContentUpdateParams) {
    const content = await prisma.sysContent.findUnique({ where: { id } })
    if (!content) {
      throw createError({ statusCode: 404, message: '内容不存在' })
    }

    await prisma.sysContent.update({
      where: { id },
      data: params,
    })

    return this.findById(id)
  },

  async delete(id: number) {
    const content = await prisma.sysContent.findUnique({ where: { id } })
    if (!content) {
      throw createError({ statusCode: 404, message: '内容不存在' })
    }

    await prisma.sysContent.delete({ where: { id } })
    return true
  },

  async incrementViewCount(id: number) {
    await prisma.sysContent.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })
  },
}
```

**Step 2: Verify typecheck**

Run: `npx nuxi typecheck`
Expected: No errors

---

### Task 2.8: Create Merchant Service

**Files:**
- Create: `server/services/merchant.service.ts`

**Step 1: Write implementation**

```typescript
// server/services/merchant.service.ts
import prisma from '../utils/prisma'

interface MerchantListParams {
  page: number
  pageSize: number
  name?: string
  categoryId?: number
  status?: number
  level?: number
  isFeatured?: number
  keyword?: string
}

interface MerchantCreateParams {
  name: string
  code?: string
  description?: string
  logo?: string
  coverImage?: string
  categoryId?: number
  regionId?: number
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
  estimatedDeliveryTime?: string
  openTime?: string
  closeTime?: string
  isFeatured?: number
  isNew?: number
  remark?: string
}

interface MerchantUpdateParams extends Partial<MerchantCreateParams> {}

export const merchantService = {
  async list(params: MerchantListParams) {
    const { page, pageSize, name, categoryId, status, level, isFeatured, keyword } = params

    const where: Record<string, unknown> = {}
    if (name) where.name = { contains: name }
    if (categoryId !== undefined) where.categoryId = categoryId
    if (status !== undefined) where.status = status
    if (level !== undefined) where.level = level
    if (isFeatured !== undefined) where.isFeatured = isFeatured
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { description: { contains: keyword } },
        { address: { contains: keyword } },
      ]
    }

    const [rows, total] = await Promise.all([
      prisma.sysMerchant.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createTime: 'desc' },
        include: {
          category: { select: { name: true } },
          region: { select: { id: true, name: true, nameEn: true, nameJp: true, parentId: true, level: true } },
        },
      }),
      prisma.sysMerchant.count({ where }),
    ])

    const list = rows.map(m => ({
      id: m.id,
      name: m.name,
      code: m.code,
      description: m.description,
      logo: m.logo,
      coverImage: m.coverImage,
      categoryId: m.categoryId,
      categoryName: m.category?.name,
      regionId: m.regionId,
      regionName: m.region
        ? (m.region.nameEn || m.region.nameJp || m.region.name)
        : undefined,
      contactName: m.contactName,
      contactPhone: m.contactPhone,
      address: m.address,
      longitude: m.longitude ? Number(m.longitude) : undefined,
      latitude: m.latitude ? Number(m.latitude) : undefined,
      status: m.status,
      level: m.level,
      tags: m.tags,
      deliveryFee: m.deliveryFee ? Number(m.deliveryFee) : undefined,
      minOrderAmount: m.minOrderAmount ? Number(m.minOrderAmount) : undefined,
      estimatedDeliveryTime: m.estimatedDeliveryTime,
      openTime: m.openTime,
      closeTime: m.closeTime,
      rating: m.rating ? Number(m.rating) : undefined,
      ratingCount: m.ratingCount,
      monthlySales: m.monthlySales,
      isFeatured: m.isFeatured,
      isNew: m.isNew,
      remark: m.remark,
      createTime: m.createTime,
      updateTime: m.updateTime,
    }))

    return { list, total, page, pageSize }
  },

  async listPublic(params: { page: number; pageSize: number; name?: string; categoryId?: number; keyword?: string }) {
    const { page, pageSize, name, categoryId, keyword } = params

    const where: Record<string, unknown> = { status: 1 }
    if (name) where.name = { contains: name }
    if (categoryId !== undefined) where.categoryId = categoryId
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { description: { contains: keyword } },
      ]
    }

    const [rows, total] = await Promise.all([
      prisma.sysMerchant.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { isFeatured: 'desc', monthlySales: 'desc' },
        include: {
          category: { select: { name: true } },
        },
      }),
      prisma.sysMerchant.count({ where }),
    ])

    const list = rows.map(m => ({
      id: m.id,
      name: m.name,
      description: m.description,
      logo: m.logo,
      coverImage: m.coverImage,
      categoryName: m.category?.name,
      address: m.address,
      rating: m.rating ? Number(m.rating) : undefined,
      ratingCount: m.ratingCount,
      monthlySales: m.monthlySales,
      deliveryFee: m.deliveryFee ? Number(m.deliveryFee) : undefined,
      minOrderAmount: m.minOrderAmount ? Number(m.minOrderAmount) : undefined,
      estimatedDeliveryTime: m.estimatedDeliveryTime,
      openTime: m.openTime,
      closeTime: m.closeTime,
      isFeatured: m.isFeatured,
      isNew: m.isNew,
    }))

    return { list, total, page, pageSize }
  },

  async findById(id: number) {
    const merchant = await prisma.sysMerchant.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        region: { select: { id: true, name: true, nameEn: true, nameJp: true } },
      },
    })
    if (!merchant) {
      throw createError({ statusCode: 404, message: '商家不存在' })
    }
    return merchant
  },

  async create(params: MerchantCreateParams) {
    const merchant = await prisma.sysMerchant.create({
      data: {
        name: params.name,
        code: params.code || null,
        description: params.description || null,
        logo: params.logo || null,
        coverImage: params.coverImage || null,
        categoryId: params.categoryId || null,
        regionId: params.regionId || null,
        contactName: params.contactName || null,
        contactPhone: params.contactPhone || null,
        address: params.address || null,
        longitude: params.longitude || null,
        latitude: params.latitude || null,
        status: params.status ?? 1,
        level: params.level ?? 1,
        tags: params.tags || null,
        deliveryFee: params.deliveryFee || null,
        minOrderAmount: params.minOrderAmount || null,
        estimatedDeliveryTime: params.estimatedDeliveryTime || null,
        openTime: params.openTime || null,
        closeTime: params.closeTime || null,
        isFeatured: params.isFeatured ?? 0,
        isNew: params.isNew ?? 0,
        remark: params.remark || null,
      },
    })
    return merchant
  },

  async update(id: number, params: MerchantUpdateParams) {
    const merchant = await prisma.sysMerchant.findUnique({ where: { id } })
    if (!merchant) {
      throw createError({ statusCode: 404, message: '商家不存在' })
    }

    await prisma.sysMerchant.update({
      where: { id },
      data: params,
    })

    return this.findById(id)
  },

  async delete(id: number) {
    const merchant = await prisma.sysMerchant.findUnique({ where: { id } })
    if (!merchant) {
      throw createError({ statusCode: 404, message: '商家不存在' })
    }

    // 检查是否有商品
    const productCount = await prisma.sysProduct.count({ where: { merchantId: id } })
    if (productCount > 0) {
      throw createError({ statusCode: 400, message: '该商家下有商品，不能删除' })
    }

    await prisma.sysMerchant.delete({ where: { id } })
    return true
  },
}
```

**Step 2: Verify typecheck**

Run: `npx nuxi typecheck`
Expected: No errors

---

### Task 2.9: Create Product Service

**Files:**
- Create: `server/services/product.service.ts`

**Step 1: Write implementation**

```typescript
// server/services/product.service.ts
import prisma from '../utils/prisma'

interface ProductListParams {
  page: number
  pageSize: number
  merchantId?: number
  productCategoryId?: number
  name?: string
  status?: number
}

interface ProductCreateParams {
  merchantId: number
  productCategoryId?: number
  name: string
  description?: string
  image?: string
  status?: number
  sort?: number
  specs?: Array<{
    name: string
    price: number
    originalPrice?: number
    isDefault?: number
    status?: number
  }>
}

interface ProductUpdateParams {
  productCategoryId?: number
  name?: string
  description?: string
  image?: string
  status?: number
  sort?: number
}

export const productService = {
  async list(params: ProductListParams) {
    const { page, pageSize, merchantId, productCategoryId, name, status } = params

    const where: Record<string, unknown> = {}
    if (merchantId !== undefined) where.merchantId = merchantId
    if (productCategoryId !== undefined) where.productCategoryId = productCategoryId
    if (name) where.name = { contains: name }
    if (status !== undefined) where.status = status

    const [rows, total] = await Promise.all([
      prisma.sysProduct.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { sort: 'asc' },
        include: {
          merchant: { select: { id: true, name: true } },
          productCategory: { select: { id: true, name: true } },
          specs: { where: { status: 1 }, orderBy: { isDefault: 'desc' } },
        },
      }),
      prisma.sysProduct.count({ where }),
    ])

    const list = rows.map(p => ({
      id: p.id,
      merchantId: p.merchantId,
      merchantName: p.merchant?.name,
      productCategoryId: p.productCategoryId,
      productCategoryName: p.productCategory?.name,
      name: p.name,
      description: p.description,
      image: p.image,
      status: p.status,
      sort: p.sort,
      specs: p.specs.map(s => ({
        id: s.id,
        name: s.name,
        price: Number(s.price),
        originalPrice: s.originalPrice ? Number(s.originalPrice) : undefined,
        isDefault: s.isDefault,
      })),
      createTime: p.createTime,
      updateTime: p.updateTime,
    }))

    return { list, total, page, pageSize }
  },

  async findById(id: number) {
    const product = await prisma.sysProduct.findUnique({
      where: { id },
      include: {
        merchant: { select: { id: true, name: true } },
        productCategory: { select: { id: true, name: true } },
        specs: { orderBy: { isDefault: 'desc' } },
      },
    })
    if (!product) {
      throw createError({ statusCode: 404, message: '商品不存在' })
    }
    return product
  },

  async create(params: ProductCreateParams) {
    const { specs, ...productData } = params

    const product = await prisma.sysProduct.create({
      data: {
        ...productData,
        description: productData.description || null,
        image: productData.image || null,
        status: productData.status ?? 1,
        sort: productData.sort ?? 0,
        specs: specs?.length ? {
          create: specs.map(s => ({
            name: s.name,
            price: s.price,
            originalPrice: s.originalPrice || null,
            isDefault: s.isDefault ?? 0,
            status: s.status ?? 1,
          })),
        } : undefined,
      },
      include: {
        specs: true,
      },
    })

    return product
  },

  async update(id: number, params: ProductUpdateParams) {
    const product = await prisma.sysProduct.findUnique({ where: { id } })
    if (!product) {
      throw createError({ statusCode: 404, message: '商品不存在' })
    }

    await prisma.sysProduct.update({
      where: { id },
      data: params,
    })

    return this.findById(id)
  },

  async delete(id: number) {
    const product = await prisma.sysProduct.findUnique({ where: { id } })
    if (!product) {
      throw createError({ statusCode: 404, message: '商品不存在' })
    }

    await prisma.sysProductSpec.deleteMany({ where: { productId: id } })
    await prisma.sysProduct.delete({ where: { id } })
    return true
  },

  // 商品规格
  async addSpec(productId: number, data: { name: string; price: number; originalPrice?: number; isDefault?: number }) {
    const product = await prisma.sysProduct.findUnique({ where: { id: productId } })
    if (!product) {
      throw createError({ statusCode: 404, message: '商品不存在' })
    }

    // 如果设置为默认，取消其他默认
    if (data.isDefault === 1) {
      await prisma.sysProductSpec.updateMany({
        where: { productId, isDefault: 1 },
        data: { isDefault: 0 },
      })
    }

    const spec = await prisma.sysProductSpec.create({
      data: {
        productId,
        name: data.name,
        price: data.price,
        originalPrice: data.originalPrice || null,
        isDefault: data.isDefault ?? 0,
        status: 1,
      },
    })

    return spec
  },

  async updateSpec(id: number, data: { name?: string; price?: number; originalPrice?: number; isDefault?: number; status?: number }) {
    const spec = await prisma.sysProductSpec.findUnique({ where: { id } })
    if (!spec) {
      throw createError({ statusCode: 404, message: '规格不存在' })
    }

    // 如果设置为默认，取消其他默认
    if (data.isDefault === 1) {
      await prisma.sysProductSpec.updateMany({
        where: { productId: spec.productId, isDefault: 1, id: { not: id } },
        data: { isDefault: 0 },
      })
    }

    await prisma.sysProductSpec.update({
      where: { id },
      data,
    })

    return prisma.sysProductSpec.findUnique({ where: { id } })
  },

  async deleteSpec(id: number) {
    const spec = await prisma.sysProductSpec.findUnique({ where: { id } })
    if (!spec) {
      throw createError({ statusCode: 404, message: '规格不存在' })
    }

    await prisma.sysProductSpec.delete({ where: { id } })
    return true
  },
}
```

**Step 2: Verify typecheck**

Run: `npx nuxi typecheck`
Expected: No errors

---

### Task 2.10: Create Cart Service

**Files:**
- Create: `server/services/cart.service.ts`

**Step 1: Write implementation**

```typescript
// server/services/cart.service.ts
import prisma from '../utils/prisma'

interface CartAddParams {
  userId: number
  merchantId: number
  productId: number
  specName?: string
  quantity?: number
}

export const cartService = {
  async list(userId: number) {
    const items = await prisma.sysCart.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            image: true,
            specs: { where: { status: 1 } },
          },
        },
        merchant: {
          select: { id: true, name: true, deliveryFee: true },
        },
      },
      orderBy: { createTime: 'desc' },
    })

    // 按商家分组
    const grouped = new Map<number, {
      merchantId: number
      merchantName: string
      deliveryFee: number | undefined
      items: typeof items
    }>()

    for (const item of items) {
      const merchantId = item.merchantId
      if (!grouped.has(merchantId)) {
        grouped.set(merchantId, {
          merchantId,
          merchantName: item.merchant?.name || '',
          deliveryFee: item.merchant?.deliveryFee ? Number(item.merchant.deliveryFee) : undefined,
          items: [],
        })
      }
      grouped.get(merchantId)!.items.push(item)
    }

    return Array.from(grouped.values())
  },

  async add(params: CartAddParams) {
    const { userId, merchantId, productId, specName, quantity } = params

    // 检查商品是否存在
    const product = await prisma.sysProduct.findUnique({ where: { id: productId } })
    if (!product) {
      throw createError({ statusCode: 404, message: '商品不存在' })
    }

    // 检查是否已在购物车
    const existing = await prisma.sysCart.findFirst({
      where: {
        userId,
        merchantId,
        productId,
        specName: specName || null,
      },
    })

    if (existing) {
      // 增加数量
      await prisma.sysCart.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + (quantity || 1) },
      })
    } else {
      // 新增
      await prisma.sysCart.create({
        data: {
          userId,
          merchantId,
          productId,
          specName: specName || null,
          quantity: quantity || 1,
        },
      })
    }

    return true
  },

  async update(id: number, userId: number, quantity: number) {
    const item = await prisma.sysCart.findUnique({ where: { id } })
    if (!item) {
      throw createError({ statusCode: 404, message: '购物车项不存在' })
    }
    if (item.userId !== userId) {
      throw createError({ statusCode: 403, message: '无权操作' })
    }

    if (quantity <= 0) {
      await prisma.sysCart.delete({ where: { id } })
    } else {
      await prisma.sysCart.update({
        where: { id },
        data: { quantity },
      })
    }

    return true
  },

  async remove(id: number, userId: number) {
    const item = await prisma.sysCart.findUnique({ where: { id } })
    if (!item) {
      throw createError({ statusCode: 404, message: '购物车项不存在' })
    }
    if (item.userId !== userId) {
      throw createError({ statusCode: 403, message: '无权操作' })
    }

    await prisma.sysCart.delete({ where: { id } })
    return true
  },

  async clear(userId: number) {
    await prisma.sysCart.deleteMany({ where: { userId } })
    return true
  },

  async count(userId: number) {
    const result = await prisma.sysCart.aggregate({
      where: { userId },
      _sum: { quantity: true },
    })
    return result._sum.quantity || 0
  },
}
```

**Step 2: Verify typecheck**

Run: `npx nuxi typecheck`
Expected: No errors

---

### Task 2.11: Create Order Service

**Files:**
- Create: `server/services/order.service.ts`

**Step 1: Write implementation**

```typescript
// server/services/order.service.ts
import prisma from '../utils/prisma'

function generateOrderNo(): string {
  const now = new Date()
  const ts = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0')
  const random = Math.floor(1000 + Math.random() * 9000)
  return `DD${ts}${random}`
}

interface OrderCreateParams {
  userId: number
  merchantId: number
  deliveryType?: string
  deliveryAddress?: string
  contactName?: string
  contactPhone?: string
  remark?: string
  items: Array<{
    productId: number
    specName?: string
    quantity?: number
  }>
}

interface OrderListParams {
  page: number
  pageSize: number
  userId?: number
  merchantId?: number
  status?: string
  orderNo?: string
}

export const orderService = {
  async create(params: OrderCreateParams) {
    const { userId, merchantId, deliveryType, deliveryAddress, contactName, contactPhone, remark, items } = params

    if (!items || items.length === 0) {
      throw createError({ statusCode: 400, message: '商品不能为空' })
    }

    const merchant = await prisma.sysMerchant.findUnique({ where: { id: merchantId } })
    if (!merchant) {
      throw createError({ statusCode: 404, message: '商家不存在' })
    }

    const orderNo = generateOrderNo()

    const result = await prisma.$transaction(async (tx) => {
      let totalAmount = 0
      const orderItems: Array<{
        productId: number
        productName: string
        productImage: string | null
        specName: string | null
        price: number
        quantity: number
        subtotal: number
      }> = []

      for (const item of items) {
        const product = await tx.sysProduct.findUnique({
          where: { id: item.productId },
          select: { id: true, name: true, image: true },
        })
        if (!product) {
          throw createError({ statusCode: 404, message: `商品 ${item.productId} 不存在` })
        }

        let price = 0
        if (item.specName) {
          const spec = await tx.sysProductSpec.findFirst({
            where: { productId: item.productId, name: item.specName, status: 1 },
          })
          if (!spec) {
            throw createError({ statusCode: 400, message: `规格 ${item.specName} 不存在` })
          }
          price = Number(spec.price)
        } else {
          const defaultSpec = await tx.sysProductSpec.findFirst({
            where: { productId: item.productId, isDefault: 1, status: 1 },
          })
          if (defaultSpec) {
            price = Number(defaultSpec.price)
          }
        }

        const quantity = item.quantity || 1
        const subtotal = price * quantity
        totalAmount += subtotal

        orderItems.push({
          productId: product.id,
          productName: product.name,
          productImage: product.image,
          specName: item.specName || null,
          price,
          quantity,
          subtotal,
        })
      }

      const order = await tx.sysOrder.create({
        data: {
          orderNo,
          merchantId,
          userId,
          totalAmount,
          deliveryFee: merchant.deliveryFee ? Number(merchant.deliveryFee) : 0,
          deliveryType: deliveryType || null,
          status: 'pending',
          deliveryAddress: deliveryAddress || null,
          contactName: contactName || null,
          contactPhone: contactPhone || null,
          remark: remark || null,
          items: {
            create: orderItems,
          },
        },
      })

      return order
    })

    return { id: result.id, orderNo: result.orderNo }
  },

  async list(params: OrderListParams) {
    const { page, pageSize, userId, merchantId, status, orderNo } = params

    const where: Record<string, unknown> = {}
    if (userId !== undefined) where.userId = userId
    if (merchantId !== undefined) where.merchantId = merchantId
    if (status) where.status = status
    if (orderNo) where.orderNo = { contains: orderNo }

    const [rows, total] = await Promise.all([
      prisma.sysOrder.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createTime: 'desc' },
        include: {
          merchant: { select: { id: true, name: true } },
          user: { select: { id: true, username: true, nickname: true } },
          items: true,
        },
      }),
      prisma.sysOrder.count({ where }),
    ])

    const list = rows.map(o => ({
      id: o.id,
      orderNo: o.orderNo,
      merchantId: o.merchantId,
      merchantName: o.merchant?.name,
      userId: o.userId,
      userName: o.user?.nickname || o.user?.username,
      totalAmount: Number(o.totalAmount),
      deliveryFee: Number(o.deliveryFee),
      deliveryType: o.deliveryType,
      status: o.status,
      deliveryAddress: o.deliveryAddress,
      contactName: o.contactName,
      contactPhone: o.contactPhone,
      remark: o.remark,
      createTime: o.createTime,
      updateTime: o.updateTime,
      items: o.items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        specName: item.specName,
        price: Number(item.price),
        quantity: item.quantity,
        subtotal: Number(item.subtotal),
      })),
    }))

    return { list, total, page, pageSize }
  },

  async findById(id: number) {
    const order = await prisma.sysOrder.findUnique({
      where: { id },
      include: {
        merchant: { select: { id: true, name: true, phone: true } },
        user: { select: { id: true, username: true, nickname: true, phone: true } },
        items: true,
      },
    })
    if (!order) {
      throw createError({ statusCode: 404, message: '订单不存在' })
    }
    return order
  },

  async updateStatus(id: number, status: string) {
    const order = await prisma.sysOrder.findUnique({ where: { id } })
    if (!order) {
      throw createError({ statusCode: 404, message: '订单不存在' })
    }

    // 验证状态流转
    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['delivering', 'cancelled'],
      delivering: ['delivered'],
      delivered: ['completed'],
      completed: [],
      cancelled: [],
    }

    if (!validTransitions[order.status]?.includes(status)) {
      throw createError({ statusCode: 400, message: `不能从 ${order.status} 变更为 ${status}` })
    }

    await prisma.sysOrder.update({
      where: { id },
      data: { status },
    })

    return this.findById(id)
  },

  async cancel(id: number, userId: number) {
    const order = await prisma.sysOrder.findUnique({ where: { id } })
    if (!order) {
      throw createError({ statusCode: 404, message: '订单不存在' })
    }
    if (order.userId !== userId) {
      throw createError({ statusCode: 403, message: '无权操作' })
    }
    if (!['pending', 'confirmed'].includes(order.status)) {
      throw createError({ statusCode: 400, message: '当前状态不能取消' })
    }

    await prisma.sysOrder.update({
      where: { id },
      data: { status: 'cancelled' },
    })

    return this.findById(id)
  },
}
```

**Step 2: Verify typecheck**

Run: `npx nuxi typecheck`
Expected: No errors

---

### Task 2.12: Create Rating Service

**Files:**
- Create: `server/services/rating.service.ts`

**Step 1: Write implementation**

```typescript
// server/services/rating.service.ts
import prisma from '../utils/prisma'

interface RatingCreateParams {
  userId: number
  orderId: number
  productId?: number
  rating: number
  content?: string
  images?: string
}

export const ratingService = {
  async create(params: RatingCreateParams) {
    const { userId, orderId, productId, rating, content, images } = params

    if (rating < 1 || rating > 5) {
      throw createError({ statusCode: 400, message: '评分必须在 1-5 之间' })
    }

    const order = await prisma.sysOrder.findUnique({ where: { id: orderId } })
    if (!order) {
      throw createError({ statusCode: 404, message: '订单不存在' })
    }
    if (order.userId !== userId) {
      throw createError({ statusCode: 403, message: '只能评价自己的订单' })
    }

    const existingRating = await prisma.sysRating.findUnique({ where: { orderId } })
    if (existingRating) {
      throw createError({ statusCode: 409, message: '该订单已评价' })
    }

    const record = await prisma.sysRating.create({
      data: {
        orderId,
        userId,
        merchantId: order.merchantId,
        productId: productId || null,
        rating,
        content: content || null,
        images: images || null,
      },
    })

    // 更新商家评分统计
    const stats = await prisma.sysRating.aggregate({
      where: { merchantId: order.merchantId },
      _avg: { rating: true },
      _count: { rating: true },
    })
    await prisma.sysMerchant.update({
      where: { id: order.merchantId },
      data: {
        rating: stats._avg.rating ? Number(stats._avg.rating.toFixed(1)) : 0,
        ratingCount: stats._count.rating,
      },
    })

    return { id: record.id }
  },

  async listByMerchant(merchantId: number, page: number, pageSize: number) {
    const where = { merchantId }

    const [rows, total] = await Promise.all([
      prisma.sysRating.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createTime: 'desc' },
        include: {
          user: { select: { id: true, nickname: true, avatar: true } },
          order: { select: { orderNo: true } },
        },
      }),
      prisma.sysRating.count({ where }),
    ])

    const list = rows.map(r => ({
      id: r.id,
      orderId: r.orderId,
      orderNo: r.order?.orderNo,
      userId: r.userId,
      userName: r.user?.nickname || '用户',
      userAvatar: r.user?.avatar,
      merchantId: r.merchantId,
      productId: r.productId,
      rating: r.rating,
      content: r.content,
      images: r.images,
      createTime: r.createTime,
    }))

    return { list, total, page, pageSize }
  },

  async listByUser(userId: number, page: number, pageSize: number) {
    const where = { userId }

    const [rows, total] = await Promise.all([
      prisma.sysRating.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createTime: 'desc' },
        include: {
          merchant: { select: { id: true, name: true } },
          order: { select: { orderNo: true } },
        },
      }),
      prisma.sysRating.count({ where }),
    ])

    const list = rows.map(r => ({
      id: r.id,
      orderId: r.orderId,
      orderNo: r.order?.orderNo,
      merchantId: r.merchantId,
      merchantName: r.merchant?.name,
      productId: r.productId,
      rating: r.rating,
      content: r.content,
      images: r.images,
      createTime: r.createTime,
    }))

    return { list, total, page, pageSize }
  },

  async getMerchantStats(merchantId: number) {
    const stats = await prisma.sysRating.aggregate({
      where: { merchantId },
      _avg: { rating: true },
      _count: { rating: true },
    })

    // 各星级数量
    const distribution = await prisma.sysRating.groupBy({
      by: ['rating'],
      where: { merchantId },
      _count: { rating: true },
    })

    return {
      average: stats._avg.rating ? Number(stats._avg.rating.toFixed(1)) : 0,
      total: stats._count.rating,
      distribution: distribution.map(d => ({
        rating: d.rating,
        count: d._count.rating,
      })),
    }
  },
}
```

**Step 2: Verify typecheck**

Run: `npx nuxi typecheck`
Expected: No errors

---

### Task 2.13: Create Address Service

**Files:**
- Create: `server/services/address.service.ts`

**Step 1: Write implementation**

```typescript
// server/services/address.service.ts
import prisma from '../utils/prisma'

interface AddressCreateParams {
  userId: number
  name: string
  phone: string
  detail: string
  label?: string
  province?: string
  city?: string
  district?: string
  isDefault?: number
}

interface AddressUpdateParams {
  name?: string
  phone?: string
  detail?: string
  label?: string
  province?: string
  city?: string
  district?: string
  isDefault?: number
}

export const addressService = {
  async list(userId: number) {
    return prisma.sysUserAddress.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    })
  },

  async findById(id: number, userId: number) {
    const address = await prisma.sysUserAddress.findUnique({ where: { id } })
    if (!address) {
      throw createError({ statusCode: 404, message: '地址不存在' })
    }
    if (address.userId !== userId) {
      throw createError({ statusCode: 403, message: '无权访问' })
    }
    return address
  },

  async create(params: AddressCreateParams) {
    const { userId, name, phone, detail, label, province, city, district, isDefault } = params

    if (isDefault === 1) {
      await prisma.sysUserAddress.updateMany({
        where: { userId, isDefault: 1 },
        data: { isDefault: 0 },
      })
    }

    const address = await prisma.sysUserAddress.create({
      data: {
        userId,
        label: label || null,
        name,
        phone,
        province: province || null,
        city: city || null,
        district: district || null,
        detail,
        isDefault: isDefault || 0,
      },
    })

    return address
  },

  async update(id: number, userId: number, params: AddressUpdateParams) {
    const address = await prisma.sysUserAddress.findUnique({ where: { id } })
    if (!address) {
      throw createError({ statusCode: 404, message: '地址不存在' })
    }
    if (address.userId !== userId) {
      throw createError({ statusCode: 403, message: '无权操作' })
    }

    if (params.isDefault === 1) {
      await prisma.sysUserAddress.updateMany({
        where: { userId, isDefault: 1, id: { not: id } },
        data: { isDefault: 0 },
      })
    }

    await prisma.sysUserAddress.update({
      where: { id },
      data: params,
    })

    return prisma.sysUserAddress.findUnique({ where: { id } })
  },

  async delete(id: number, userId: number) {
    const address = await prisma.sysUserAddress.findUnique({ where: { id } })
    if (!address) {
      throw createError({ statusCode: 404, message: '地址不存在' })
    }
    if (address.userId !== userId) {
      throw createError({ statusCode: 403, message: '无权操作' })
    }

    await prisma.sysUserAddress.delete({ where: { id } })
    return true
  },

  async setDefault(id: number, userId: number) {
    const address = await prisma.sysUserAddress.findUnique({ where: { id } })
    if (!address) {
      throw createError({ statusCode: 404, message: '地址不存在' })
    }
    if (address.userId !== userId) {
      throw createError({ statusCode: 403, message: '无权操作' })
    }

    await prisma.sysUserAddress.updateMany({
      where: { userId },
      data: { isDefault: 0 },
    })

    await prisma.sysUserAddress.update({
      where: { id },
      data: { isDefault: 1 },
    })

    return prisma.sysUserAddress.findUnique({ where: { id } })
  },
}
```

**Step 2: Verify typecheck**

Run: `npx nuxi typecheck`
Expected: No errors

---

### Task 2.14: Create Notification Service

**Files:**
- Create: `server/services/notification.service.ts`

**Step 1: Write implementation**

```typescript
// server/services/notification.service.ts
import prisma from '../utils/prisma'

interface NotificationListParams {
  userId: number
  page: number
  pageSize: number
  type?: string
  isRead?: number
}

export const notificationService = {
  async list(params: NotificationListParams) {
    const { userId, page, pageSize, type, isRead } = params

    const where: Record<string, unknown> = {
      userId: { in: [userId, 0] },
    }
    if (type) where.type = type
    if (isRead !== undefined) where.isRead = isRead

    const [rows, total] = await Promise.all([
      prisma.sysNotification.findMany({
        where,
        orderBy: { createTime: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.sysNotification.count({ where }),
    ])

    return { list: rows, total, page, pageSize }
  },

  async unreadCount(userId: number) {
    const count = await prisma.sysNotification.count({
      where: {
        userId: { in: [userId, 0] },
        isRead: 0,
      },
    })
    return count
  },

  async markAsRead(id: number, userId: number) {
    const notification = await prisma.sysNotification.findUnique({ where: { id } })
    if (!notification) {
      throw createError({ statusCode: 404, message: '通知不存在' })
    }
    if (notification.userId !== userId && notification.userId !== 0) {
      throw createError({ statusCode: 403, message: '无权操作' })
    }

    await prisma.sysNotification.update({
      where: { id },
      data: { isRead: 1 },
    })

    return true
  },

  async markAllAsRead(userId: number) {
    await prisma.sysNotification.updateMany({
      where: {
        userId: { in: [userId, 0] },
        isRead: 0,
      },
      data: { isRead: 1 },
    })

    return true
  },

  async create(data: {
    userId: number
    title: string
    content: string
    type: string
  }) {
    return prisma.sysNotification.create({ data })
  },
}
```

**Step 2: Verify typecheck**

Run: `npx nuxi typecheck`
Expected: No errors

---

### Task 2.15: Create File Service

**Files:**
- Create: `server/services/file.service.ts`

**Step 1: Write implementation**

```typescript
// server/services/file.service.ts
import prisma from '../utils/prisma'
import { generateStorageName, saveFile } from '../utils/fileStorage'

interface FileUploadResult {
  id: number
  fileName: string
  filePath: string
  fileSize: number
  fileType: string | null
  extension: string | null
  createTime: Date
}

export const fileService = {
  async upload(files: Array<{ filename: string; data: Buffer; type?: string }>, uploadBy?: number): Promise<FileUploadResult | FileUploadResult[]> {
    if (!files || files.length === 0) {
      throw createError({ statusCode: 400, message: '请选择要上传的文件' })
    }

    const results: FileUploadResult[] = []

    for (const file of files) {
      const { filename, data, type } = file
      const fileName = filename
      const fileType = type || null
      const extension = fileName.includes('.')
        ? fileName.substring(fileName.lastIndexOf('.'))
        : null
      const fileSize = data.length
      const storageName = generateStorageName(fileName)

      const url = await saveFile(data, storageName)

      const record = await prisma.sysFile.create({
        data: {
          fileName,
          storageName,
          filePath: url,
          fileSize,
          fileType,
          extension,
          uploadBy: uploadBy || null,
          status: 1,
        },
      })

      results.push({
        id: record.id,
        fileName: record.fileName,
        filePath: record.filePath,
        fileSize: record.fileSize,
        fileType: record.fileType,
        extension: record.extension,
        createTime: record.createTime,
      })
    }

    return results.length === 1 ? results[0] : results
  },

  async list(params: { page: number; pageSize: number; fileName?: string; fileType?: string }) {
    const { page, pageSize, fileName, fileType } = params

    const where: Record<string, unknown> = {}
    if (fileName) where.fileName = { contains: fileName }
    if (fileType) where.fileType = { contains: fileType }

    const [rows, total] = await Promise.all([
      prisma.sysFile.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createTime: 'desc' },
      }),
      prisma.sysFile.count({ where }),
    ])

    return { list: rows, total, page, pageSize }
  },

  async findById(id: number) {
    const file = await prisma.sysFile.findUnique({ where: { id } })
    if (!file) {
      throw createError({ statusCode: 404, message: '文件不存在' })
    }
    return file
  },

  async delete(id: number) {
    const file = await prisma.sysFile.findUnique({ where: { id } })
    if (!file) {
      throw createError({ statusCode: 404, message: '文件不存在' })
    }

    await prisma.sysFile.delete({ where: { id } })
    return true
  },
}
```

**Step 2: Verify typecheck**

Run: `npx nuxi typecheck`
Expected: No errors

---

### Task 2.16: Create Region Service

**Files:**
- Create: `server/services/region.service.ts`

**Step 1: Write implementation**

```typescript
// server/services/region.service.ts
import prisma from '../utils/prisma'

interface RegionCreateParams {
  name: string
  nameEn?: string
  nameJp?: string
  parentId?: number | null
  level?: number
  status?: number
}

interface RegionUpdateParams extends Partial<RegionCreateParams> {}

export const regionService = {
  async tree() {
    const regions = await prisma.sysRegion.findMany({
      orderBy: { sort: 'asc' },
    })

    // 构建树结构
    const map = new Map<number, RegionNode & { children: RegionNode[] }>()
    const roots: RegionNode[] = []

    for (const r of regions) {
      map.set(r.id, { ...r, children: [] })
    }

    for (const r of regions) {
      const node = map.get(r.id)!
      if (r.parentId && map.has(r.parentId)) {
        map.get(r.parentId)!.children.push(node)
      } else {
        roots.push(node)
      }
    }

    return roots
  },

  async list(params: { page: number; pageSize: number; name?: string; level?: number; status?: number }) {
    const { page, pageSize, name, level, status } = params

    const where: Record<string, unknown> = {}
    if (name) where.name = { contains: name }
    if (level !== undefined) where.level = level
    if (status !== undefined) where.status = status

    const [rows, total] = await Promise.all([
      prisma.sysRegion.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { sort: 'asc' },
      }),
      prisma.sysRegion.count({ where }),
    ])

    return { list: rows, total, page, pageSize }
  },

  async findById(id: number) {
    const region = await prisma.sysRegion.findUnique({ where: { id } })
    if (!region) {
      throw createError({ statusCode: 404, message: '地区不存在' })
    }
    return region
  },

  async create(params: RegionCreateParams) {
    const region = await prisma.sysRegion.create({
      data: {
        name: params.name,
        nameEn: params.nameEn || null,
        nameJp: params.nameJp || null,
        parentId: params.parentId || null,
        level: params.level ?? 1,
        status: params.status ?? 1,
        sort: 0,
      },
    })
    return region
  },

  async update(id: number, params: RegionUpdateParams) {
    const region = await prisma.sysRegion.findUnique({ where: { id } })
    if (!region) {
      throw createError({ statusCode: 404, message: '地区不存在' })
    }

    await prisma.sysRegion.update({
      where: { id },
      data: params,
    })

    return this.findById(id)
  },

  async delete(id: number) {
    const region = await prisma.sysRegion.findUnique({ where: { id } })
    if (!region) {
      throw createError({ statusCode: 404, message: '地区不存在' })
    }

    // 检查是否有子地区
    const childCount = await prisma.sysRegion.count({ where: { parentId: id } })
    if (childCount > 0) {
      throw createError({ statusCode: 400, message: '该地区下有子地区，不能删除' })
    }

    // 检查是否有关联商家
    const merchantCount = await prisma.sysMerchant.count({ where: { regionId: id } })
    if (merchantCount > 0) {
      throw createError({ statusCode: 400, message: '该地区下有商家，不能删除' })
    }

    await prisma.sysRegion.delete({ where: { id } })
    return true
  },
}

interface RegionNode {
  id: number
  name: string
  nameEn: string | null
  nameJp: string | null
  parentId: number | null
  level: number
  status: number
  sort: number
  children: RegionNode[]
}
```

**Step 2: Verify typecheck**

Run: `npx nuxi typecheck`
Expected: No errors

---

### Task 2.17: Create Price Unit Service

**Files:**
- Create: `server/services/price-unit.service.ts`

**Step 1: Write implementation**

```typescript
// server/services/price-unit.service.ts
import prisma from '../utils/prisma'

interface PriceUnitCreateParams {
  name: string
  symbol?: string
  code: string
  status?: number
  sort?: number
}

interface PriceUnitUpdateParams extends Partial<PriceUnitCreateParams> {}

export const priceUnitService = {
  async list(params: { page: number; pageSize: number; name?: string; code?: string; status?: number }) {
    const { page, pageSize, name, code, status } = params

    const where: Record<string, unknown> = {}
    if (name) where.name = { contains: name }
    if (code) where.code = { contains: code }
    if (status !== undefined) where.status = status

    const [rows, total] = await Promise.all([
      prisma.sysPriceUnit.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { sort: 'asc' },
      }),
      prisma.sysPriceUnit.count({ where }),
    ])

    return { list: rows, total, page, pageSize }
  },

  async findAll() {
    return prisma.sysPriceUnit.findMany({
      where: { status: 1 },
      orderBy: { sort: 'asc' },
    })
  },

  async findById(id: number) {
    const priceUnit = await prisma.sysPriceUnit.findUnique({ where: { id } })
    if (!priceUnit) {
      throw createError({ statusCode: 404, message: '价格单位不存在' })
    }
    return priceUnit
  },

  async create(params: PriceUnitCreateParams) {
    const existing = await prisma.sysPriceUnit.findUnique({ where: { code: params.code } })
    if (existing) {
      throw createError({ statusCode: 409, message: '价格单位编码已存在' })
    }

    const priceUnit = await prisma.sysPriceUnit.create({
      data: {
        name: params.name,
        symbol: params.symbol || null,
        code: params.code,
        status: params.status ?? 1,
        sort: params.sort ?? 0,
      },
    })
    return priceUnit
  },

  async update(id: number, params: PriceUnitUpdateParams) {
    const priceUnit = await prisma.sysPriceUnit.findUnique({ where: { id } })
    if (!priceUnit) {
      throw createError({ statusCode: 404, message: '价格单位不存在' })
    }

    if (params.code && params.code !== priceUnit.code) {
      const existing = await prisma.sysPriceUnit.findUnique({ where: { code: params.code } })
      if (existing) {
        throw createError({ statusCode: 409, message: '价格单位编码已存在' })
      }
    }

    await prisma.sysPriceUnit.update({
      where: { id },
      data: params,
    })

    return this.findById(id)
  },

  async delete(id: number) {
    const priceUnit = await prisma.sysPriceUnit.findUnique({ where: { id } })
    if (!priceUnit) {
      throw createError({ statusCode: 404, message: '价格单位不存在' })
    }

    await prisma.sysPriceUnit.delete({ where: { id } })
    return true
  },
}
```

**Step 2: Verify typecheck**

Run: `npx nuxi typecheck`
Expected: No errors

---

### Task 2.18: Create Monitor Service

**Files:**
- Create: `server/services/monitor.service.ts`

**Step 1: Write implementation**

```typescript
// server/services/monitor.service.ts
import { cacheInfo, cacheDbSize, cachePing, cacheKeys, cacheGet, cacheDel, cacheFlushDb, cacheTtl, cacheType } from '../utils/cache'
import { getKeys, getItem, removeItem, clearAll } from '../utils/storage'
import prisma from '../utils/prisma'

export const monitorService = {
  // 缓存概览
  async cacheOverview() {
    const pingOk = await cachePing()
    if (!pingOk) {
      return {
        version: '',
        uptimeInSeconds: 0,
        usedMemory: '0',
        usedMemoryHuman: '0 B',
        totalKeys: 0,
        connectedClients: 0,
        hitRate: 'N/A',
        os: '',
        arch: '',
        tcpPort: 6379,
        available: false,
      }
    }

    const [info, totalKeys] = await Promise.all([
      cacheInfo(),
      cacheDbSize(),
    ])

    const keyspaceHits = Number(info.keyspace_hits) || 0
    const keyspaceMisses = Number(info.keyspace_misses) || 0
    const totalOps = keyspaceHits + keyspaceMisses
    const hitRate = totalOps > 0 ? ((keyspaceHits / totalOps) * 100).toFixed(2) + '%' : 'N/A'

    return {
      version: info.version || '',
      uptimeInSeconds: Number(info.uptime_in_seconds) || 0,
      usedMemory: info.used_memory || '0',
      usedMemoryHuman: info.used_memory_human || '0 B',
      totalKeys,
      connectedClients: Number(info.connected_clients) || 0,
      hitRate,
      os: info.os || '',
      arch: info.arch_bits || '',
      tcpPort: Number(info.tcp_port) || 6379,
      available: true,
    }
  },

  // 缓存 Key 搜索
  async cacheSearch(pattern: string, page: number, pageSize: number) {
    const keys = await cacheKeys(pattern || '*')
    const total = keys.length
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const pagedKeys = keys.slice(start, end)

    const items = []
    for (const key of pagedKeys) {
      const ttl = await cacheTtl(key)
      const type = await cacheType(key)
      items.push({ key, ttl, type })
    }

    return { list: items, total, page, pageSize }
  },

  // 缓存 Key 详情
  async cacheDetail(key: string) {
    const type = await cacheType(key)
    const ttl = await cacheTtl(key)
    const value = await cacheGet(key)

    return { key, type, ttl, value }
  },

  // 缓存删除
  async cacheDelete(key: string) {
    return cacheDel(key)
  },

  // 缓存清空
  async cacheFlush() {
    return cacheFlushDb()
  },

  // 在线用户列表
  async onlineUsers(params: { page: number; pageSize: number; username?: string }) {
    const { page, pageSize, username } = params

    const keys = await getKeys('admin_online_user:*')
    const users = []

    for (const key of keys) {
      const user = await getItem(key)
      if (user) {
        users.push(user)
      }
    }

    // 过滤
    let filtered = users
    if (username) {
      filtered = users.filter((u: any) => u.username?.includes(username))
    }

    // 分页
    const total = filtered.length
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const list = filtered.slice(start, end)

    return { list, total, page, pageSize }
  },

  // 强制下线
  async forceOffline(userId: number) {
    await removeItem(`admin_online_user:${userId}`)
    return true
  },

  // 系统监控信息
  async systemInfo() {
    // 这里可以添加更多系统信息
    return {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    }
  },
}
```

**Step 2: Verify typecheck**

Run: `npx nuxi typecheck`
Expected: No errors

---

## Phase 3: API Route Restructuring

> **⚠️ 重要：** Phase 3 涉及大量文件移动和前端路径更新，需要谨慎执行。建议先创建 todo list，逐个模块处理。

### Task 3.1: Create Admin Auth Routes

**Files:**
- Move: `server/api/auth/*` → `server/api/admin/auth/*`
- Rewrite: Each file to use `authService`

**Step 1: Move files**

```bash
mkdir -p server/api/admin/auth
mv server/api/auth/login.post.ts server/api/admin/auth/login.post.ts
mv server/api/auth/logout.post.ts server/api/admin/auth/logout.post.ts
mv server/api/auth/userinfo.get.ts server/api/admin/auth/userinfo.get.ts
mv server/api/auth/menus.get.ts server/api/admin/auth/menus.get.ts
mv server/api/auth/profile.put.ts server/api/admin/auth/profile.put.ts
mv server/api/auth/change-password.put.ts server/api/admin/auth/change-password.put.ts
rmdir server/api/auth
```

**Step 2: Rewrite each file to use service**

Example for `login.post.ts`:

```typescript
// server/api/admin/auth/login.post.ts
import { authService } from '../../../services/auth.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body

  if (!username || !password) {
    throw createError({ statusCode: 400, message: '用户名和密码不能为空' })
  }

  const ip = getRequestIP(event, { xForwardedFor: true }) || ''
  const result = await authService.login({ username, password, userType: 1, ip })

  return { code: 200, msg: '登录成功', data: result }
})
```

**Step 3: Repeat for all 6 files**

---

### Task 3.2: Create Admin System Routes

**Files:**
- Move: `server/api/system/*` → `server/api/admin/*`
- Rewrite: Each file to use corresponding service

**Step 1: Move directories**

```bash
# user
mkdir -p server/api/admin/user
mv server/api/system/user/* server/api/admin/user/
rmdir server/api/system/user

# role
mkdir -p server/api/admin/role
mv server/api/system/role/* server/api/admin/role/
rmdir server/api/system/role

# permission
mkdir -p server/api/admin/permission
mv server/api/system/permission/* server/api/admin/permission/
rmdir server/api/system/permission

# dict-type
mkdir -p server/api/admin/dict-type
mv server/api/system/dict-type/* server/api/admin/dict-type/
rmdir server/api/system/dict-type

# dict-data
mkdir -p server/api/admin/dict-data
mv server/api/system/dict-data/* server/api/admin/dict-data/
rmdir server/api/system/dict-data

# category
mkdir -p server/api/admin/category
mv server/api/system/category/* server/api/admin/category/
rmdir server/api/system/category

# content
mkdir -p server/api/admin/content
mv server/api/system/content/* server/api/admin/content/
rmdir server/api/system/content

# file
mkdir -p server/api/admin/file
mv server/api/system/file/* server/api/admin/file/
rmdir server/api/system/file

# notification
mkdir -p server/api/admin/notification
mv server/api/system/notification/* server/api/admin/notification/
rmdir server/api/system/notification

# online-user
mkdir -p server/api/admin/online-user
mv server/api/system/online-user/* server/api/admin/online-user/
rmdir server/api/system/online-user

# cache
mkdir -p server/api/admin/cache
mv server/api/system/cache/* server/api/admin/cache/
rmdir server/api/system/cache

# monitor
mkdir -p server/api/admin/monitor
mv server/api/system/monitor/* server/api/admin/monitor/
rmdir server/api/system/monitor

# region
mkdir -p server/api/admin/region
mv server/api/system/region/* server/api/admin/region/
rmdir server/api/system/region

# price-unit
mkdir -p server/api/admin/price-unit
mv server/api/system/price-unit/* server/api/admin/price-unit/
rmdir server/api/system/price-unit

# audit-log
mkdir -p server/api/admin/audit-log
mv server/api/system/audit-log/* server/api/admin/audit-log/
rmdir server/api/system/audit-log

# 移除空的 system 目录
rmdir server/api/system
```

**Step 2: Rewrite each file to use service**

This is the largest step - approximately 50+ files need to be rewritten.

---

### Task 3.3: Restructure Eats Routes

**Files:**
- Move: `server/api/eats/merchant/*` → `server/api/portal/merchant/*` (公开浏览) + keep admin management in `server/api/admin/merchant/*`
- Move: `server/api/eats/product/*` → `server/api/portal/product/*` (公开浏览) + keep admin management in `server/api/admin/product/*`
- Move: `server/api/eats/merchant-category/*` → `server/api/portal/merchant-category/*` + `server/api/admin/merchant-category/*`
- Move: `server/api/eats/product-category/*` → `server/api/admin/product-category/*`
- Move: `server/api/eats/cart/*` → `server/api/cart/*`
- Move: `server/api/eats/order/*` → `server/api/order/*`
- Move: `server/api/eats/rating/*` → `server/api/rating/*`

**Step 1: Create new directories**

```bash
mkdir -p server/api/portal/merchant
mkdir -p server/api/portal/product
mkdir -p server/api/portal/merchant-category
mkdir -p server/api/admin/merchant
mkdir -p server/api/admin/product
mkdir -p server/api/admin/product-category
mkdir -p server/api/admin/merchant-category
mkdir -p server/api/cart
mkdir -p server/api/order
mkdir -p server/api/rating
```

**Step 2: Move and rewrite files**

---

### Task 3.4: Update Server Middleware

**Files:**
- Modify: `server/middleware/auth.ts`

**Step 1: Update API path patterns**

Update the middleware to handle the new API paths:
- `/api/admin/*` → 需要 admin 登录
- `/api/portal/auth/*` → 可选登录
- `/api/portal/address/*` → 需要登录
- `/api/portal/merchant/*` → 公开
- `/api/cart/*` → 需要登录
- `/api/order/*` → 需要登录
- `/api/rating/*` → 需要登录

---

### Task 3.5: Update Frontend API Paths

**Files:**
- Modify: `app/stores/auth.ts`
- Modify: `app/stores/portal-auth.ts`
- Modify: `app/composables/useExport.ts`
- Modify: `app/pages/admin/**/*.vue` (~15 files)
- Modify: `app/pages/portal/**/*.vue` (~5 files)
- Modify: `app/components/NotificationBell.vue`
- Modify: `app/components/RichTextEditor.vue`

**Step 1: Update auth store**

```typescript
// app/stores/auth.ts
// Old: '/api/auth/login' → New: '/api/admin/auth/login'
// Old: '/api/auth/logout' → New: '/api/admin/auth/logout'
// Old: '/api/auth/userinfo' → New: '/api/admin/auth/userinfo'
// Old: '/api/auth/menus' → New: '/api/admin/auth/menus'
```

**Step 2: Update all admin pages**

```typescript
// 旧路径 → 新路径
'/api/system/user' → '/api/admin/user'
'/api/system/role' → '/api/admin/role'
'/api/system/permission' → '/api/admin/permission'
'/api/system/dict-type' → '/api/admin/dict-type'
'/api/system/dict-data' → '/api/admin/dict-data'
'/api/system/category' → '/api/admin/category'
'/api/system/content' → '/api/admin/content'
'/api/system/file' → '/api/admin/file'
'/api/system/notification' → '/api/admin/notification'
'/api/system/online-user' → '/api/admin/online-user'
'/api/system/cache' → '/api/admin/cache'
'/api/system/region' → '/api/admin/region'
'/api/system/price-unit' → '/api/admin/price-unit'
'/api/auth/profile' → '/api/admin/auth/profile'
'/api/auth/change-password' → '/api/admin/auth/change-password'
'/api/eats/merchant' → '/api/admin/merchant' (管理) 或 '/api/portal/merchant' (浏览)
'/api/eats/product' → '/api/admin/product'
'/api/eats/product-category' → '/api/admin/product-category'
'/api/eats/merchant-category' → '/api/admin/merchant-category'
```

**Step 3: Update portal pages**

```typescript
'/api/portal/address' → '/api/portal/address' (保持不变)
'/api/portal/auth/profile' → '/api/portal/auth/profile' (保持不变)
'/api/portal/auth/change-password' → '/api/portal/auth/change-password' (保持不变)
```

---

## Phase 4: Testing

### Task 4.1: Create Service Unit Tests

**Files:**
- Create: `tests/services/auth.service.test.ts`
- Create: `tests/services/user.service.test.ts`
- Create: `tests/services/cart.service.test.ts`
- Create: `tests/services/order.service.test.ts`
- Create: `tests/services/rating.service.test.ts`

**Step 1: Setup test utilities**

```typescript
// tests/setup.ts
import { prisma } from '../server/utils/prisma'

export async function cleanupDatabase() {
  // 清理测试数据
  await prisma.sysRating.deleteMany()
  await prisma.sysOrderItem.deleteMany()
  await prisma.sysOrder.deleteMany()
  await prisma.sysCart.deleteMany()
  await prisma.sysUserAddress.deleteMany()
  await prisma.sysNotification.deleteMany()
  await prisma.sysProductSpec.deleteMany()
  await prisma.sysProduct.deleteMany()
  await prisma.sysMerchant.deleteMany()
  await prisma.sysUserRole.deleteMany()
  await prisma.sysRolePermission.deleteMany()
  await prisma.sysRole.deleteMany()
  await prisma.sysUser.deleteMany()
}
```

**Step 2: Write auth service tests**

```typescript
// tests/services/auth.service.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { authService } from '../../server/services/auth.service'
import { cleanupDatabase } from '../setup'

describe('AuthService', () => {
  beforeAll(async () => {
    await cleanupDatabase()
  })

  afterAll(async () => {
    await cleanupDatabase()
  })

  it('should register a new user', async () => {
    const result = await authService.register({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      nickname: 'Test User',
    })

    expect(result.token).toBeDefined()
    expect(result.user.username).toBe('testuser')
    expect(result.user.email).toBe('test@example.com')
  })

  it('should login with valid credentials', async () => {
    const result = await authService.login({
      username: 'testuser',
      password: 'password123',
      userType: 0,
    })

    expect(result.token).toBeDefined()
    expect(result.user.username).toBe('testuser')
  })

  it('should reject invalid password', async () => {
    await expect(
      authService.login({
        username: 'testuser',
        password: 'wrongpassword',
        userType: 0,
      })
    ).rejects.toThrow('用户名或密码错误')
  })
})
```

**Step 3: Write cart service tests**

```typescript
// tests/services/cart.service.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { cartService } from '../../server/services/cart.service'
import { cleanupDatabase } from '../setup'

describe('CartService', () => {
  let testUserId: number
  let testMerchantId: number
  let testProductId: number

  beforeAll(async () => {
    await cleanupDatabase()
    // 创建测试数据...
  })

  afterAll(async () => {
    await cleanupDatabase()
  })

  it('should add item to cart', async () => {
    await cartService.add({
      userId: testUserId,
      merchantId: testMerchantId,
      productId: testProductId,
      quantity: 1,
    })

    const items = await cartService.list(testUserId)
    expect(items).toHaveLength(1)
  })

  it('should increase quantity if item exists', async () => {
    await cartService.add({
      userId: testUserId,
      merchantId: testMerchantId,
      productId: testProductId,
      quantity: 2,
    })

    const items = await cartService.list(testUserId)
    expect(items[0].items[0].quantity).toBe(3)
  })
})
```

**Step 4: Write order service tests**

```typescript
// tests/services/order.service.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { orderService } from '../../server/services/order.service'
import { cleanupDatabase } from '../setup'

describe('OrderService', () => {
  beforeAll(async () => {
    await cleanupDatabase()
    // 创建测试数据...
  })

  afterAll(async () => {
    await cleanupDatabase()
  })

  it('should create order', async () => {
    const result = await orderService.create({
      userId: 1,
      merchantId: 1,
      items: [{ productId: 1, quantity: 2 }],
    })

    expect(result.orderNo).toBeDefined()
    expect(result.orderNo).toMatch(/^DD\d{14}\d{4}$/)
  })

  it('should not create empty order', async () => {
    await expect(
      orderService.create({
        userId: 1,
        merchantId: 1,
        items: [],
      })
    ).rejects.toThrow('商品不能为空')
  })
})
```

**Step 5: Write rating service tests**

```typescript
// tests/services/rating.service.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { ratingService } from '../../server/services/rating.service'
import { cleanupDatabase } from '../setup'

describe('RatingService', () => {
  beforeAll(async () => {
    await cleanupDatabase()
    // 创建测试数据...
  })

  afterAll(async () => {
    await cleanupDatabase()
  })

  it('should create rating', async () => {
    const result = await ratingService.create({
      userId: 1,
      orderId: 1,
      rating: 5,
      content: 'Great food!',
    })

    expect(result.id).toBeDefined()
  })

  it('should reject invalid rating', async () => {
    await expect(
      ratingService.create({
        userId: 1,
        orderId: 1,
        rating: 6,
      })
    ).rejects.toThrow('评分必须在 1-5 之间')
  })
})
```

---

### Task 4.2: Run All Tests

**Step 1: Run tests**

```bash
npm run test
```

**Step 2: Verify all tests pass**

Expected: All tests green

---

## Phase 5: Final Verification

### Task 5.1: Type Check

```bash
npx nuxi typecheck
```

Expected: No errors

### Task 5.2: Build

```bash
npm run build
```

Expected: Build succeeds

### Task 5.3: Update Documentation

**Files:**
- Modify: `AGENTS.md`
- Modify: `README.md`

**Step 1: Update AGENTS.md**

Update the directory structure section to reflect the new architecture:

```markdown
## 目录结构

server/
  services/               业务逻辑层（18个service）
    auth.service.ts       认证（登录/注册/密码）
    user.service.ts       用户管理
    role.service.ts       角色管理
    permission.service.ts 权限/菜单
    dict.service.ts       字典
    category.service.ts   分类
    content.service.ts    内容
    merchant.service.ts   商家
    product.service.ts    商品
    cart.service.ts       购物车
    order.service.ts      订单
    rating.service.ts     评价
    address.service.ts    地址
    notification.service.ts 通知
    file.service.ts       文件
    region.service.ts     地区
    price-unit.service.ts 价格单位
    monitor.service.ts    监控
  utils/                  工具函数（auto-imported）
    prisma.ts             Prisma 单例
    jwt.ts                JWT 工具
    response.ts           统一响应
    pagination.ts         分页工具
    query.ts              查询工具
    ...
  api/                    API 路由（按消费者划分）
    admin/                后台管理接口
    portal/               前台门户接口
    cart/                 购物车接口
    order/                订单接口
    rating/               评价接口
```

---

## 执行策略

### 并行化机会

| 批次 | 任务 | 可并行 |
|---|---|---|
| 1 | Phase 1 (3 tasks) | ✅ 全部并行 |
| 2 | Phase 2 (18 tasks) | ✅ 全部并行 |
| 3 | Phase 3 (5 tasks) | ⚠️ 部分并行（3.1-3.3 可并行，3.4-3.5 依赖前3个） |
| 4 | Phase 4 (2 tasks) | ✅ 并行 |
| 5 | Phase 5 (3 tasks) | ❌ 顺序执行 |

### 风险点

1. **API 路径变更**：所有前端调用都需要同步更新，否则会导致404
2. **Prisma 关联查询**：service 层需要保持原有的 `include` 和 `select` 逻辑
3. **事务处理**：订单创建等需要事务的操作需要在 service 层正确处理
4. **错误处理**：保持原有的错误消息和状态码

### 回滚策略

如果重构过程中出现问题：
1. Git stash 或 revert
2. 逐步检查每个 service 的实现
3. 对比原有 API 的响应格式

---

## 完成标准

- [ ] Phase 1: 3 个工具文件创建完成
- [ ] Phase 2: 18 个 service 文件创建完成
- [ ] Phase 3: API 路由重构完成，所有文件移动到新位置
- [ ] Phase 4: 所有测试通过
- [ ] Phase 5: typecheck 通过，build 成功，文档更新
- [ ] 所有前端 API 路径更新完成
- [ ] 无回归 bug
