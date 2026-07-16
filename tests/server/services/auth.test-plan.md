# AuthService 测试计划 — TDD 学习指南

## 测试原则回顾（TDD 三定律）

1. **Red**: 先写一个失败的测试
2. **Green**: 写最少的代码让测试通过
3. **Refactor**: 优化代码，保持测试通过

---

## 一、测试用例设计方法论

### 1. 等价类划分

将输入数据划分为若干等价类，从每个类中选取代表性数据测试：

```
username:
  ├─ 有效等价类: [2-20字符] → "admin", "test123"
  ├─ 无效等价类: [0-1字符] → "a", ""
  └─ 无效等价类: [21+字符] → "a".repeat(21)
```

### 2. 边界值分析

测试边界条件及其附近值：

```
password 长度 ≥6:
  ├─ 边界值: 5字符 → 失败
  ├─ 边界值: 6字符 → 成功
  └─ 边界值: 7字符 → 成功
```

### 3. 错误推测法

基于经验推测可能出错的地方：

- 用户不存在
- 密码错误
- 账号被禁用
- 重复注册
- 并发问题（乐观锁）

### 4. 状态转换测试

针对有状态的业务逻辑：

```
订单状态机:
  pending → confirmed → preparing → delivering → delivered → completed
    ↓           ↓            ↓
  cancelled   cancelled   cancelled
```

---

## 二、auth.service.ts 方法分析

### 方法清单

| 方法 | 功能 | 复杂度 | 测试优先级 |
|------|------|--------|-----------|
| `login` | 用户登录 | ⭐⭐⭐ | P0 |
| `register` | 用户注册 | ⭐⭐⭐ | P0 |
| `getUserInfo` | 获取用户信息+权限 | ⭐⭐ | P1 |
| `getUserMenus` | 获取用户菜单树 | ⭐⭐⭐ | P1 |
| `updateProfile` | 更新个人资料 | ⭐ | P2 |
| `changePassword` | 修改密码 | ⭐⭐ | P1 |

### 依赖分析

```
auth.service.ts
├── bcrypt (密码加密)
├── prisma (数据库)
├── signToken (JWT 生成)
├── setItem (存储在线状态)
└── createError (错误处理)
```

---

## 三、详细测试用例

### 3.1 login 方法

#### 测试用例 1: 用户不存在

```typescript
it('用户不存在时应返回 401', async () => {
  // Arrange: 准备测试数据
  mockPrisma.sysUser.findUnique.mockResolvedValue(null)
  
  // Act: 执行被测方法
  await authService.login({
    username: 'nonexistent',
    password: 'any',
    userType: 1,
  })
  
  // Assert: 验证结果
  // expect(createError).toHaveBeenCalledWith({
  //   statusCode: 401,
  //   message: '用户名或密码错误',
  // })
})
```

**设计思路**：
- **为什么用 401 而不是 404？** 安全考虑，不暴露用户是否存在
- **为什么 mock 返回 null？** 模拟数据库中找不到用户

#### 测试用例 2: 密码错误

```typescript
it('密码错误时应返回 401', async () => {
  // Arrange
  mockPrisma.sysUser.findUnique.mockResolvedValue({
    id: 1, username: 'admin', password: 'hashed_password', status: 1,
  })
  vi.mocked(bcrypt.compare).mockResolvedValue(false as never)
  
  // Act
  await authService.login({
    username: 'admin',
    password: 'wrong_password',
    userType: 1,
  })
  
  // Assert
  // expect(createError).toHaveBeenCalledWith({
  //   statusCode: 401,
  //   message: '用户名或密码错误',
  // })
})
```

**设计思路**：
- **为什么 mock bcrypt.compare？** 隔离外部依赖，只测业务逻辑
- **为什么返回 false？** 模拟密码不匹配

#### 测试用例 3: 账号被禁用

```typescript
it('账号被禁用时应返回 403', async () => {
  // Arrange
  mockPrisma.sysUser.findUnique.mockResolvedValue({
    id: 1, username: 'admin', password: 'hashed', status: 0, // status=0 表示禁用
  })
  
  // Act
  await authService.login({
    username: 'admin',
    password: 'correct',
    userType: 1,
  })
  
  // Assert
  // expect(createError).toHaveBeenCalledWith({
  //   statusCode: 403,
  //   message: '账号已被禁用，请联系管理员',
  // })
})
```

**设计思路**：
- **为什么是 403 而不是 401？** 401=认证失败，403=授权失败（账号存在但被禁用）
- **为什么先检查禁用再检查密码？** 安全考虑，避免泄露密码验证信息

#### 测试用例 4: 登录成功（后台管理员）

```typescript
it('登录成功应返回 token 和用户信息', async () => {
  // Arrange
  const mockUser = {
    id: 1, username: 'admin', nickname: '管理员',
    email: 'admin@test.com', phone: '13800138000',
    avatar: 'avatar.jpg', password: 'hashed', status: 1, userType: 1,
  }
  mockPrisma.sysUser.findUnique.mockResolvedValue(mockUser)
  vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
  vi.mocked(signToken).mockReturnValue('mock_token')
  vi.mocked(setItem).mockResolvedValue(undefined)
  mockPrisma.sysNotification.create.mockResolvedValue({} as any)
  
  // Act
  const result = await authService.login({
    username: 'admin',
    password: 'correct',
    userType: 1,
    ip: '127.0.0.1',
  })
  
  // Assert
  expect(result).toEqual({
    token: 'mock_token',
    user: {
      id: 1, username: 'admin', nickname: '管理员',
      email: 'admin@test.com', phone: '13800138000',
      avatar: 'avatar.jpg', status: 1, userType: 1,
    },
  })
  expect(signToken).toHaveBeenCalledWith({
    userId: 1, username: 'admin', userType: 1,
  })
})
```

**设计思路**：
- **为什么验证 signToken 调用参数？** 确保 JWT 包含正确信息
- **为什么 mock 所有外部依赖？** 隔离测试，只验证业务逻辑

#### 测试用例 5: 在线记录失败不影响登录

```typescript
it('在线记录失败不应影响登录', async () => {
  // Arrange
  mockPrisma.sysUser.findUnique.mockResolvedValue({
    id: 1, username: 'admin', password: 'hashed', status: 1, userType: 1,
  })
  vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
  vi.mocked(signToken).mockReturnValue('mock_token')
  vi.mocked(setItem).mockRejectedValue(new Error('Redis 连接失败'))
  
  // Act
  const result = await authService.login({
    username: 'admin',
    password: 'correct',
    userType: 1,
  })
  
  // Assert
  expect(result.token).toBe('mock_token') // 登录仍然成功
})
```

**设计思路**：
- **为什么要测试这个？** 验证降级策略：存储失败不阻塞核心功能
- **为什么用 mockRejectedValue？** 模拟异步错误

---

### 3.2 register 方法

#### 测试用例 6: 用户名长度校验

```typescript
describe('用户名长度校验', () => {
  it('用户名少于 2 字符应返回 400', async () => {
    await expect(authService.register({
      username: 'a', email: 'test@test.com', password: '123456',
    })).rejects.toThrow('用户名长度需在 2-20 个字符之间')
  })

  it('用户名超过 20 字符应返回 400', async () => {
    await expect(authService.register({
      username: 'a'.repeat(21), email: 'test@test.com', password: '123456',
    })).rejects.toThrow('用户名长度需在 2-20 个字符之间')
  })

  it('用户名 2 字符应成功', async () => {
    // 正常测试流程...
  })
})
```

**设计思路**：
- **为什么用 describe 分组？** 相关测试放在一起，便于阅读
- **为什么用 rejects.toThrow？** 测试异步错误

#### 测试用例 7: 密码长度校验

```typescript
it('密码少于 6 字符应返回 400', async () => {
  await expect(authService.register({
    username: 'test', email: 'test@test.com', password: '12345',
  })).rejects.toThrow('密码长度不能少于 6 个字符')
})
```

#### 测试用例 8: 邮箱格式校验

```typescript
describe('邮箱格式校验', () => {
  it('缺少 @ 应返回 400', async () => {
    await expect(authService.register({
      username: 'test', email: 'test.com', password: '123456',
    })).rejects.toThrow('邮箱格式不正确')
  })

  it('缺少域名应返回 400', async () => {
    await expect(authService.register({
      username: 'test', email: 'test@', password: '123456',
    })).rejects.toThrow('邮箱格式不正确')
  })

  it('有效邮箱应通过', async () => {
    // 正常测试流程...
  })
})
```

#### 测试用例 9: 用户名重复

```typescript
it('用户名已存在应返回 409', async () => {
  // Arrange
  mockPrisma.sysUser.findUnique.mockResolvedValue({
    id: 1, username: 'existing', // 用户已存在
  })
  
  // Act & Assert
  await expect(authService.register({
    username: 'existing', email: 'new@test.com', password: '123456',
  })).rejects.toThrow('用户名已被注册')
})
```

**设计思路**：
- **为什么是 409 Conflict？** RESTful 规范：资源冲突
- **为什么用 findUnique 而不是 findFirst？** username 是唯一约束

#### 测试用例 10: 邮箱重复

```typescript
it('邮箱已存在应返回 409', async () => {
  // Arrange
  mockPrisma.sysUser.findUnique.mockResolvedValue(null) // username 不重复
  mockPrisma.sysUser.findFirst.mockResolvedValue({
    id: 1, email: 'existing@test.com', // 邮箱已存在
  })
  
  // Act & Assert
  await expect(authService.register({
    username: 'new_user', email: 'existing@test.com', password: '123456',
  })).rejects.toThrow('邮箱已被注册')
})
```

**设计思路**：
- **为什么用 findFirst？** email 不是唯一约束，可能有多条
- **为什么先检查 username 再检查 email？** 性能考虑，unique 查询更快

#### 测试用例 11: 注册成功

```typescript
it('注册成功应返回 token 和用户信息', async () => {
  // Arrange
  mockPrisma.sysUser.findUnique.mockResolvedValue(null) // username 不重复
  mockPrisma.sysUser.findFirst.mockResolvedValue(null) // email 不重复
  vi.mocked(bcrypt.hash).mockResolvedValue('hashed_password' as never)
  mockPrisma.sysUser.create.mockResolvedValue({
    id: 1, username: 'new_user', nickname: 'new_user',
    email: 'new@test.com', phone: null, avatar: null,
    status: 1, userType: 0,
  })
  vi.mocked(signToken).mockReturnValue('mock_token')
  vi.mocked(setItem).mockResolvedValue(undefined)
  
  // Act
  const result = await authService.register({
    username: 'new_user', email: 'new@test.com', password: '123456',
  })
  
  // Assert
  expect(result).toEqual({
    token: 'mock_token',
    user: {
      id: 1, username: 'new_user', nickname: 'new_user',
      email: 'new@test.com', phone: null, avatar: null,
      status: 1, userType: 0,
    },
  })
  expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10)
})
```

**设计思路**：
- **为什么验证 bcrypt.hash 调用？** 确保密码被正确加密
- **为什么验证 salt rounds = 10？** 安全与性能平衡

---

### 3.3 getUserInfo 方法

#### 测试用例 12: 用户不存在

```typescript
it('用户不存在应返回 404', async () => {
  mockPrisma.sysUser.findUnique.mockResolvedValue(null)
  
  await expect(authService.getUserInfo(999)).rejects.toThrow('用户不存在')
})
```

#### 测试用例 13: 获取用户信息成功

```typescript
it('应返回用户信息、角色和权限', async () => {
  // Arrange
  mockPrisma.sysUser.findUnique.mockResolvedValue({
    id: 1, username: 'admin', nickname: '管理员',
    email: 'admin@test.com', phone: null, avatar: null, status: 1,
    roles: [{
      role: {
        code: 'admin',
        permissions: [
          { permission: { code: 'system:user:view' } },
          { permission: { code: 'system:user:create' } },
        ],
      },
    }],
  })
  
  // Act
  const result = await authService.getUserInfo(1)
  
  // Assert
  expect(result.roles).toEqual(['admin'])
  expect(result.permissions).toContain('system:user:view')
  expect(result.permissions).toContain('system:user:create')
})
```

**设计思路**：
- **为什么验证权限去重？** 多个角色可能有相同权限
- **为什么用toContain？** 权限顺序不重要，只要包含即可

---

### 3.4 getUserMenus 方法

#### 测试用例 14: admin 角色获取所有菜单

```typescript
it('admin 角色应返回所有菜单', async () => {
  // Arrange
  mockPrisma.sysUser.findUnique.mockResolvedValue({
    id: 1, roles: [{ role: { code: 'admin' } }], menus: [],
  })
  mockPrisma.sysPermission.findMany.mockResolvedValue([
    { id: 1, parentId: 0, name: '系统管理', type: 0, sort: 1 },
    { id: 2, parentId: 1, name: '用户管理', type: 1, path: '/system/user', sort: 1 },
  ])
  
  // Act
  const result = await authService.getUserMenus(1)
  
  // Assert
  expect(result).toHaveLength(1) // 根节点
  expect(result[0].children).toHaveLength(1) // 子菜单
})
```

**设计思路**：
- **为什么要测 admin 特殊逻辑？** admin 绕过权限检查是关键业务规则
- **为什么验证树结构？** 菜单必须是树形结构

#### 测试用例 15: 普通用户只返回有权限的菜单

```typescript
it('普通用户应只返回有权限的菜单', async () => {
  // Arrange
  mockPrisma.sysUser.findUnique.mockResolvedValue({
    id: 2, 
    roles: [{ role: { code: 'user', permissions: [{ permissionId: 1 }] } }],
    menus: [],
  })
  mockPrisma.sysPermission.findMany.mockResolvedValue([
    { id: 1, parentId: 0, name: '系统管理', type: 0, sort: 1, status: 1 },
  ])
  
  // Act
  const result = await authService.getUserMenus(2)
  
  // Assert
  expect(result).toHaveLength(1)
})
```

---

### 3.5 changePassword 方法

#### 测试用例 16: 旧密码错误

```typescript
it('旧密码错误应返回 400', async () => {
  // Arrange
  mockPrisma.sysUser.findUnique.mockResolvedValue({
    id: 1, password: 'hashed_old',
  })
  vi.mocked(bcrypt.compare).mockResolvedValue(false as never)
  
  // Act & Assert
  await expect(authService.changePassword(1, 'wrong', 'new123')).rejects.toThrow('旧密码不正确')
})
```

#### 测试用例 17: 密码更新成功

```typescript
it('密码更新成功', async () => {
  // Arrange
  mockPrisma.sysUser.findUnique.mockResolvedValue({
    id: 1, password: 'hashed_old',
  })
  vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
  vi.mocked(bcrypt.hash).mockResolvedValue('hashed_new' as never)
  mockPrisma.sysUser.update.mockResolvedValue({} as any)
  
  // Act
  const result = await authService.changePassword(1, 'old_password', 'new_password')
  
  // Assert
  expect(result).toBe(true)
  expect(bcrypt.hash).toHaveBeenCalledWith('new_password', 10)
  expect(mockPrisma.sysUser.update).toHaveBeenCalledWith({
    where: { id: 1 },
    data: { password: 'hashed_new' },
  })
})
```

---

## 四、测试覆盖率目标

| 方法 | 行覆盖率 | 分支覆盖率 | 说明 |
|------|----------|------------|------|
| login | 100% | 100% | 核心认证逻辑 |
| register | 100% | 100% | 输入校验密集 |
| getUserInfo | 90% | 80% | 主要路径 |
| getUserMenus | 90% | 85% | 树构建逻辑 |
| updateProfile | 80% | 70% | 简单 CRUD |
| changePassword | 100% | 100% | 安全关键 |

---

## 五、Mock 设计原则

### 1. 什么该 Mock？

- ✅ 外部服务（Redis、第三方 API）
- ✅ 数据库（Prisma）
- ✅ 文件系统
- ✅ 时间（Date.now）
- ❌ 业务逻辑本身
- ❌ 数据转换函数

### 2. Mock 粒度

```typescript
// ❌ 太粗：整个 prisma
vi.mock('prisma', () => mockPrisma)

// ✅ 适当：具体方法
mockPrisma.sysUser.findUnique = vi.fn()

// ❌ 太细：返回值内部结构
mockPrisma.sysUser.findUnique.mockResolvedValue({
  id: 1,
  // ... 100 个字段
})
```

### 3. Mock 命名规范

```typescript
// Arrange 阶段的 mock 设置
const mockUser = { id: 1, username: 'admin' }
mockPrisma.sysUser.findUnique.mockResolvedValue(mockUser)

// Act 阶段执行被测代码
const result = await authService.login(...)

// Assert 阶段验证
expect(mockPrisma.sysUser.findUnique).toHaveBeenCalledWith({
  where: { username: 'admin' },
})
```

---

## 六、TDD 实践步骤

### Step 1: RED — 写失败的测试

```typescript
it('用户不存在时应返回 401', async () => {
  // 先写测试，不关心实现
  await expect(authService.login({
    username: 'nonexistent',
    password: 'any',
    userType: 1,
  })).rejects.toThrow('用户名或密码错误')
})
```

运行测试 → 失败（因为还没实现 login 方法）

### Step 2: GREEN — 写最少代码通过

```typescript
async login(params) {
  const user = await prisma.sysUser.findUnique({ where: { username: params.username } })
  if (!user) {
    throw createError({ statusCode: 401, message: '用户名或密码错误' })
  }
  // ... 其他逻辑
}
```

运行测试 → 通过

### Step 3: REFACTOR — 优化代码

```typescript
// 提取验证逻辑
private async validateUser(username: string) {
  const user = await prisma.sysUser.findUnique({ where: { username } })
  if (!user) throw createError({ statusCode: 401, message: '用户名或密码错误' })
  if (user.status === 0) throw createError({ statusCode: 403, message: '账号已被禁用' })
  return user
}
```

运行测试 → 仍然通过

---

## 七、常见错误与避免

### 错误 1: 测试间耦合

```typescript
// ❌ 错误：依赖其他测试的执行顺序
let sharedUser = null
it('创建用户', () => { sharedUser = ... })
it('查询用户', () => { expect(sharedUser).toBeDefined() })

// ✅ 正确：每个测试独立
it('查询存在的用户', async () => {
  mockPrisma.sysUser.findUnique.mockResolvedValue(mockUser)
  // ...
})
```

### 错误 2: 测试实现而非行为

```typescript
// ❌ 错误：测试内部实现
expect(mockPrisma.sysUser.findUnique).toHaveBeenCalledWith({
  where: { username: 'admin' },
  select: { id: true, password: true }, // 测试了 select 字段
})

// ✅ 正确：测试行为结果
const result = await authService.login(...)
expect(result.user.id).toBe(1)
```

### 错误 3: 过度 Mock

```typescript
// ❌ 错误：Mock 了业务逻辑
vi.mock('../services/auth.service', () => ({
  login: vi.fn().mockResolvedValue({ token: 'mock' }),
}))

// ✅ 正确：只 Mock 外部依赖
vi.mock('../utils/prisma', () => mockPrisma)
vi.mock('../utils/jwt', () => ({ signToken: vi.fn() }))
```

---

## 八、测试数据工厂

### 创建用户工厂

```typescript
function buildUser(overrides?: Partial<User>) {
  return {
    id: 1,
    username: 'test_user',
    nickname: '测试用户',
    email: 'test@test.com',
    phone: '13800138000',
    avatar: null,
    password: 'hashed_password',
    status: 1,
    userType: 0,
    createTime: new Date(),
    updateTime: new Date(),
    ...overrides,
  }
}

// 使用
const user = buildUser({ username: 'admin', status: 0 })
```

### 创建角色工厂

```typescript
function buildRole(overrides?: Partial<Role>) {
  return {
    id: 1,
    name: '普通用户',
    code: 'user',
    status: 1,
    sort: 0,
    ...overrides,
  }
}
```

---

## 九、运行与验证

```bash
# 运行所有测试
npm run test

# 运行 auth 相关测试
npm run test -- auth

# 运行并显示覆盖率
npm run test -- --coverage

# 监听模式（TDD 推荐）
npm run test:watch
```

---

## 十、下一步

完成 auth.service 测试后，建议继续：
1. `order.service.ts` — 订单状态机测试
2. `cart.service.ts` — 购物车合并逻辑测试
3. `rating.service.ts` — 评分统计计算测试
