import { defineStore } from 'pinia'
import type { UserInfo, LoginResult } from '#shared/types/api'

export const usePortalAuthStore = defineStore('portal-auth', () => {
  const token = useCookie('portal_token', { maxAge: 60 * 60 * 24 })
  const user = ref<UserInfo | null>(null)

  const isLoggedIn = computed(() => !!token.value)

  async function login(email: string, password: string) {
    const res = await $fetch<{ code: number; data: LoginResult }>('/api/portal/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    token.value = res.data.token
    user.value = res.data.user
    return res
  }

  async function register(data: { username: string; email: string; password: string; nickname?: string; phone?: string }) {
    const res = await $fetch<{ code: number; data: LoginResult }>('/api/portal/auth/register', {
      method: 'POST',
      body: data,
    })
    return res
  }

  async function fetchUserInfo() {
    try {
      const res = await $fetch<{ code: number; data: { user: UserInfo } }>('/api/portal/auth/userinfo')
      user.value = res.data.user
    } catch {
      token.value = null
      user.value = null
    }
  }

  function logout() {
    $fetch('/api/portal/auth/logout', { method: 'POST' }).catch(() => {})
    token.value = null
    user.value = null
    navigateTo('/portal/login')
  }

  return {
    token,
    user,
    isLoggedIn,
    login,
    register,
    fetchUserInfo,
    logout,
  }
})
