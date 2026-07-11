import { defineStore } from 'pinia'
import type { UserInfo, MenuNode, UserinfoResult, LoginResult } from '#shared/types/api'

export const useAuthStore = defineStore('auth', () => {
  const token = useCookie('admin_token', { maxAge: 60 * 60 * 24 })
  const user = ref<UserInfo | null>(null)
  const roles = ref<string[]>([])
  const permissions = ref<string[]>([])
  const menus = ref<MenuNode[]>([])

  // 仅检查 cookie 中的 token，避免 SSR 时因 user 未加载而被错误重定向
  const isLoggedIn = computed(() => !!token.value)

  async function login(username: string, password: string) {
    const res = await $fetch<{ code: number; data: LoginResult }>('/api/admin/auth/login', {
      method: 'POST',
      body: { username, password },
    })
    token.value = res.data.token
    user.value = res.data.user
    return res
  }

  async function fetchUserInfo() {
    try {
      const res = await $fetch<{ code: number; data: UserinfoResult }>('/api/admin/auth/userinfo')
      user.value = res.data.user
      roles.value = res.data.roles
      permissions.value = res.data.permissions
    } catch {
      token.value = null
      user.value = null
    }
  }

  async function fetchMenus() {
    try {
      const res = await $fetch<{ code: number; data: MenuNode[] }>('/api/admin/auth/menus')
      menus.value = res.data
      return res.data
    } catch {
      menus.value = []
    }
  }

  function logout() {
    token.value = null
    user.value = null
    roles.value = []
    permissions.value = []
    menus.value = []
    navigateTo('/admin/login')
  }

  function hasPermission(code: string) {
    // 超级管理员拥有所有权限
    if (roles.value.includes('admin')) return true
    return permissions.value.includes(code)
  }

  return {
    token,
    user,
    roles,
    permissions,
    menus,
    isLoggedIn,
    login,
    fetchUserInfo,
    fetchMenus,
    logout,
    hasPermission,
  }
})
