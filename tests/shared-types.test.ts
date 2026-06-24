import { describe, it, expect } from 'vitest'
import type { ApiResponse, PaginatedData, UserItem, LoginResult, MenuNode, AuditLogItem, NotificationItem } from '#shared/types/api'

describe('Shared Types', () => {
  it('ApiResponse should be a valid type', () => {
    const res: ApiResponse<string> = { code: 200, data: 'ok' }
    expect(res.code).toBe(200)
    expect(res.data).toBe('ok')
  })

  it('PaginatedData should hold list and total', () => {
    const data: PaginatedData<number> = { list: [1, 2, 3], total: 3, page: 1, pageSize: 10 }
    expect(data.list.length).toBe(3)
  })

  it('UserItem should have required fields', () => {
    const user: UserItem = {
      id: 1, username: 'admin', nickname: null, email: null,
      phone: null, avatar: null, status: 1,
      createTime: '2024-01-01', updateTime: '2024-01-01',
      roles: [],
    }
    expect(user.username).toBe('admin')
  })

  it('LoginResult should have token and user', () => {
    const res: LoginResult = {
      token: 'abc',
      user: { id: 1, username: 'admin', nickname: null, email: null, phone: null, avatar: null, status: 1 },
    }
    expect(res.token).toBe('abc')
    expect(res.user.username).toBe('admin')
  })

  it('MenuNode should support nesting', () => {
    const menu: MenuNode = {
      id: 1, name: '系统管理', code: null, type: 0,
      path: null, icon: 'Setting', sort: 1, visible: 1,
      children: [
        { id: 2, name: '用户管理', code: null, type: 1, path: '/system/user', icon: 'User', sort: 1, visible: 1, children: [] },
      ],
    }
    expect(menu.children.length).toBe(1)
    expect(menu.children[0].path).toBe('/system/user')
  })

  it('AuditLogItem should have required fields', () => {
    const log: AuditLogItem = {
      id: 1, userId: 1, username: 'admin', action: 'CREATE',
      target: 'user', targetId: 2, detail: null, ip: '127.0.0.1', createTime: '2024-01-01',
    }
    expect(log.action).toBe('CREATE')
  })

  it('NotificationItem should have type field', () => {
    const notif: NotificationItem = {
      id: 1, userId: 1, title: 'Test', content: 'Hello',
      type: 'system', isRead: 0, createTime: '2024-01-01',
    }
    expect(notif.type).toBe('system')
  })
})
