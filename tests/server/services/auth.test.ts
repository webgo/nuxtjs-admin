// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

function createMockChain(data: any = []) {
  const result = Array.isArray(data) ? data : data ? [data] : []
  const chain: any = {
    _result: result,
    from: vi.fn(() => chain),
    where: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    offset: vi.fn(() => chain),
    select: vi.fn(() => chain),
    innerJoin: vi.fn(() => chain),
    leftJoin: vi.fn(() => chain),
    groupBy: vi.fn(() => chain),
    values: vi.fn(() => chain),
    set: vi.fn(() => chain),
    execute: vi.fn(() => Promise.resolve(result)),
  }
  chain[Symbol.toStringTag] = 'Promise'
  chain.then = (resolve: any, reject?: any) => Promise.resolve(result).then(resolve, reject)
  chain.catch = (reject: any) => Promise.resolve(result).catch(reject)
  chain.finally = (cb: any) => Promise.resolve(result).finally(cb)
  return chain
}

const mockDb = {
  select: vi.fn(() => createMockChain([])),
  insert: vi.fn(() => createMockChain([{ insertId: 1, affectedRows: 1 }])),
  update: vi.fn(() => createMockChain([{ affectedRows: 1 }])),
  delete: vi.fn(() => createMockChain([{ affectedRows: 1 }])),
  execute: vi.fn(() => Promise.resolve([])),
}

vi.mock('../../../server/utils/db', () => ({ default: mockDb }))

const mockBcrypt = {
  compare: vi.fn(),
  hash: vi.fn(),
}
vi.mock('bcryptjs', () => ({ default: mockBcrypt }))

const mockJwt = {
  signToken: vi.fn(),
}
vi.mock('../../../server/utils/jwt', () => mockJwt)

const mockStorage = {
  setItem: vi.fn(),
}
vi.mock('../../../server/utils/storage', () => mockStorage)

const mockCreateError = vi.fn()
vi.stubGlobal('createError', mockCreateError)

const { authService } = await import('../../../server/services/auth.service')

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateError.mockImplementation((params) => {
      const error = new Error(params.message) as any
      error.statusCode = params.statusCode
      throw error
    })
  })

  describe('login', () => {
    it('用户不存在时应抛出 401', async () => {
      mockDb.select.mockReturnValueOnce(createMockChain([]))

      await expect(authService.login({
        username: 'nonexistent',
        password: 'any',
        userType: 1,
      })).rejects.toThrow('用户名或密码错误')
    })

    it('密码错误时应抛出 401', async () => {
      mockDb.select.mockReturnValueOnce(createMockChain([{
        id: 1, username: 'admin', password: 'hashed_password', status: 1,
      }]))
      mockBcrypt.compare.mockResolvedValue(false)

      await expect(authService.login({
        username: 'admin',
        password: 'wrong_password',
        userType: 1,
      })).rejects.toThrow('用户名或密码错误')
    })

    it('账号被禁用时应抛出 403', async () => {
      mockDb.select.mockReturnValueOnce(createMockChain([{
        id: 1, username: 'admin', password: 'hashed', status: 0,
      }]))

      await expect(authService.login({
        username: 'admin',
        password: 'correct',
        userType: 1,
      })).rejects.toThrow('账号已被禁用，请联系管理员')
    })

    it('登录成功应返回 token 和用户信息', async () => {
      const mockUser = {
        id: 1, username: 'admin', nickname: '管理员',
        email: 'admin@test.com', phone: '13800138000',
        avatar: 'avatar.jpg', password: 'hashed', status: 1, userType: 1,
      }
      mockDb.select.mockReturnValueOnce(createMockChain([mockUser]))
      mockBcrypt.compare.mockResolvedValue(true)
      mockJwt.signToken.mockReturnValue('mock_token')
      mockStorage.setItem.mockResolvedValue(undefined)
      mockDb.insert.mockReturnValueOnce(createMockChain({}))

      const result = await authService.login({
        username: 'admin',
        password: 'correct',
        userType: 1,
        ip: '127.0.0.1',
      })

      expect(result).toEqual({
        token: 'mock_token',
        user: {
          id: 1, username: 'admin', nickname: '管理员',
          email: 'admin@test.com', phone: '13800138000',
          avatar: 'avatar.jpg', status: 1, userType: 1,
        },
      })
      expect(mockJwt.signToken).toHaveBeenCalledWith({
        userId: 1, username: 'admin', userType: 1,
      })
    })

    it('在线记录失败不应影响登录', async () => {
      mockDb.select.mockReturnValueOnce(createMockChain([{
        id: 1, username: 'admin', password: 'hashed', status: 1,
      }]))
      mockBcrypt.compare.mockResolvedValue(true)
      mockJwt.signToken.mockReturnValue('mock_token')
      mockStorage.setItem.mockRejectedValue(new Error('Redis 连接失败'))

      const result = await authService.login({
        username: 'admin',
        password: 'correct',
        userType: 1,
      })

      expect(result.token).toBe('mock_token')
    })

    it('后台登录应创建通知', async () => {
      mockDb.select.mockReturnValueOnce(createMockChain([{
        id: 1, username: 'admin', password: 'hashed', status: 1,
      }]))
      mockBcrypt.compare.mockResolvedValue(true)
      mockJwt.signToken.mockReturnValue('mock_token')
      mockStorage.setItem.mockResolvedValue(undefined)
      mockDb.insert.mockReturnValueOnce(createMockChain({}))

      await authService.login({
        username: 'admin',
        password: 'correct',
        userType: 1,
      })

      expect(mockDb.insert).toHaveBeenCalled()
    })

    it('前台登录不应创建通知', async () => {
      mockDb.select.mockReturnValueOnce(createMockChain([{
        id: 1, username: 'user', password: 'hashed', status: 1,
      }]))
      mockBcrypt.compare.mockResolvedValue(true)
      mockJwt.signToken.mockReturnValue('mock_token')
      mockStorage.setItem.mockResolvedValue(undefined)

      await authService.login({
        username: 'user',
        password: 'correct',
        userType: 0,
      })

      expect(mockDb.insert).not.toHaveBeenCalled()
    })
  })

  describe('register', () => {
    it('用户名少于 2 字符应抛出 400', async () => {
      await expect(authService.register({
        username: 'a', email: 'test@test.com', password: '123456',
      })).rejects.toThrow('用户名长度需在 2-20 个字符之间')
    })

    it('用户名超过 20 字符应抛出 400', async () => {
      await expect(authService.register({
        username: 'a'.repeat(21), email: 'test@test.com', password: '123456',
      })).rejects.toThrow('用户名长度需在 2-20 个字符之间')
    })

    it('密码少于 6 字符应抛出 400', async () => {
      await expect(authService.register({
        username: 'test', email: 'test@test.com', password: '12345',
      })).rejects.toThrow('密码长度不能少于 6 个字符')
    })

    it('邮箱格式不正确应抛出 400', async () => {
      await expect(authService.register({
        username: 'test', email: 'invalid-email', password: '123456',
      })).rejects.toThrow('邮箱格式不正确')
    })

    it('用户名已存在应抛出 409', async () => {
      mockDb.select.mockReturnValueOnce(createMockChain([{
        id: 1, username: 'existing',
      }]))

      await expect(authService.register({
        username: 'existing', email: 'new@test.com', password: '123456',
      })).rejects.toThrow('用户名已被注册')
    })

    it('邮箱已存在应抛出 409', async () => {
      mockDb.select.mockReturnValueOnce(createMockChain([]))
      mockDb.select.mockReturnValueOnce(createMockChain([{
        id: 1, email: 'existing@test.com',
      }]))

      await expect(authService.register({
        username: 'new_user', email: 'existing@test.com', password: '123456',
      })).rejects.toThrow('邮箱已被注册')
    })

    it('注册成功应返回 token 和用户信息', async () => {
      mockDb.select.mockReturnValueOnce(createMockChain([]))
      mockDb.select.mockReturnValueOnce(createMockChain([]))
      mockBcrypt.hash.mockResolvedValue('hashed_password')
      mockDb.insert.mockReturnValueOnce(createMockChain([{ insertId: 1, affectedRows: 1 }]))
      mockJwt.signToken.mockReturnValue('mock_token')
      mockStorage.setItem.mockResolvedValue(undefined)

      const result = await authService.register({
        username: 'new_user', email: 'new@test.com', password: '123456',
      })

      expect(result).toEqual({
        token: 'mock_token',
        user: {
          id: 1, username: 'new_user', nickname: 'new_user',
          email: 'new@test.com', phone: null, avatar: null,
          status: 1, userType: 0,
        },
      })
      expect(mockBcrypt.hash).toHaveBeenCalledWith('123456', 10)
    })

    it('注册时应使用 nickname 参数（如果提供）', async () => {
      mockDb.select.mockReturnValueOnce(createMockChain([]))
      mockDb.select.mockReturnValueOnce(createMockChain([]))
      mockBcrypt.hash.mockResolvedValue('hashed_password')
      mockDb.insert.mockReturnValueOnce(createMockChain([{ insertId: 1, affectedRows: 1 }]))
      mockJwt.signToken.mockReturnValue('mock_token')
      mockStorage.setItem.mockResolvedValue(undefined)

      const result = await authService.register({
        username: 'new_user', email: 'new@test.com', password: '123456',
        nickname: '自定义昵称',
      })

      expect(result.user.nickname).toBe('自定义昵称')
    })
  })

  describe('getUserInfo', () => {
    it('用户不存在应抛出 404', async () => {
      mockDb.select.mockReturnValueOnce(createMockChain([]))

      await expect(authService.getUserInfo(999)).rejects.toThrow('用户不存在')
    })

    it('应返回用户信息、角色和权限', async () => {
      mockDb.select.mockReturnValueOnce(createMockChain([{
        id: 1, username: 'admin', nickname: '管理员',
        email: 'admin@test.com', phone: null, avatar: null, status: 1,
      }]))
      mockDb.select.mockReturnValueOnce(createMockChain([
        { roleCode: 'admin', permissionCode: 'system:user:view' },
        { roleCode: 'admin', permissionCode: 'system:user:create' },
      ]))

      const result = await authService.getUserInfo(1)

      expect(result.roles).toEqual(['admin'])
      expect(result.permissions).toContain('system:user:view')
      expect(result.permissions).toContain('system:user:create')
    })

    it('多个角色的权限应去重', async () => {
      mockDb.select.mockReturnValueOnce(createMockChain([{
        id: 1, username: 'user', nickname: '用户',
        email: 'user@test.com', phone: null, avatar: null, status: 1,
      }]))
      mockDb.select.mockReturnValueOnce(createMockChain([
        { roleCode: 'role1', permissionCode: 'perm1' },
        { roleCode: 'role2', permissionCode: 'perm1' },
      ]))

      const result = await authService.getUserInfo(1)

      const permCount = result.permissions.filter(p => p === 'perm1').length
      expect(permCount).toBe(1)
    })
  })

  describe('getUserMenus', () => {
    it('用户不存在应抛出 404', async () => {
      mockDb.select.mockReturnValueOnce(createMockChain([]))

      await expect(authService.getUserMenus(999)).rejects.toThrow('用户不存在')
    })

    it('admin 角色应返回所有菜单', async () => {
      mockDb.select.mockReturnValueOnce(createMockChain([{
        id: 1, username: 'admin',
      }]))
      mockDb.select.mockReturnValueOnce(createMockChain([
        { permissionId: 1, parentId: 0, name: '系统管理', type: 0, code: null, path: null, icon: null, sort: 1, status: 1, visible: 1 },
        { permissionId: 2, parentId: 1, name: '用户管理', type: 1, code: null, path: '/system/user', icon: null, sort: 1, status: 1, visible: 1 },
      ]))
      mockDb.select.mockReturnValueOnce(createMockChain([
        { permissionId: 3, parentId: 0, name: '仪表盘', type: 1, code: null, path: '/dashboard', icon: null, sort: 0, status: 1, visible: 1 },
      ]))

      const result = await authService.getUserMenus(1)

      expect(result.length).toBeGreaterThanOrEqual(1)
    })

    it('普通用户应只返回有权限的菜单', async () => {
      mockDb.select.mockReturnValueOnce(createMockChain([{
        id: 2, username: 'user',
      }]))
      mockDb.select.mockReturnValueOnce(createMockChain([
        { permissionId: 1, parentId: 0, name: '系统管理', type: 0, code: null, path: null, icon: null, sort: 1, status: 1, visible: 1 },
      ]))
      mockDb.select.mockReturnValueOnce(createMockChain([]))

      const result = await authService.getUserMenus(2)

      expect(result).toHaveLength(1)
    })

    it('菜单应按 sort 排序', async () => {
      mockDb.select.mockReturnValueOnce(createMockChain([{
        id: 1, username: 'admin',
      }]))
      mockDb.select.mockReturnValueOnce(createMockChain([
        { permissionId: 2, parentId: 0, name: '菜单B', type: 0, code: null, path: null, icon: null, sort: 2, status: 1, visible: 1 },
        { permissionId: 1, parentId: 0, name: '菜单A', type: 0, code: null, path: null, icon: null, sort: 1, status: 1, visible: 1 },
      ]))
      mockDb.select.mockReturnValueOnce(createMockChain([]))

      const result = await authService.getUserMenus(1)

      expect(result[0].name).toBe('菜单A')
      expect(result[1].name).toBe('菜单B')
    })
  })

  describe('changePassword', () => {
    it('用户不存在应抛出 404', async () => {
      mockDb.select.mockReturnValueOnce(createMockChain([]))

      await expect(authService.changePassword(999, 'old', 'new')).rejects.toThrow('用户不存在')
    })

    it('旧密码错误应抛出 400', async () => {
      mockDb.select.mockReturnValueOnce(createMockChain([{
        id: 1, password: 'hashed_old',
      }]))
      mockBcrypt.compare.mockResolvedValue(false)

      await expect(authService.changePassword(1, 'wrong', 'new123')).rejects.toThrow('旧密码不正确')
    })

    it('密码更新成功', async () => {
      mockDb.select.mockReturnValueOnce(createMockChain([{
        id: 1, password: 'hashed_old',
      }]))
      mockBcrypt.compare.mockResolvedValue(true)
      mockBcrypt.hash.mockResolvedValue('hashed_new')
      mockDb.update.mockReturnValueOnce(createMockChain({}))

      const result = await authService.changePassword(1, 'old_password', 'new_password')

      expect(result).toBe(true)
      expect(mockBcrypt.hash).toHaveBeenCalledWith('new_password', 10)
      expect(mockDb.update).toHaveBeenCalled()
    })
  })

  describe('updateProfile', () => {
    it('应更新用户资料', async () => {
      mockDb.update.mockReturnValueOnce(createMockChain({}))
      mockDb.select.mockReturnValueOnce(createMockChain([{
        id: 1, username: 'admin', nickname: '新昵称',
        email: 'new@test.com', phone: '13900139000', avatar: null,
      }]))

      const result = await authService.updateProfile(1, {
        nickname: '新昵称',
        email: 'new@test.com',
        phone: '13900139000',
      })

      expect(result.nickname).toBe('新昵称')
      expect(result.email).toBe('new@test.com')
    })
  })
})
