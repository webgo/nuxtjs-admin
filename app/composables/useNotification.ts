import type { NotificationItem } from '#shared/types/api'

// Module-level singleton — shared across all components
const unreadCount = ref(0)
let pollingTimer: ReturnType<typeof setInterval> | null = null

export function useNotification() {
  async function refreshUnreadCount() {
    try {
      const res = await $fetch<{ code: number; data: number }>('/api/system/notification/unread-count')
      unreadCount.value = res.data
    } catch {
      // API 不可用时静默失败
    }
  }

  async function fetchNotifications() {
    try {
      const [listRes, countRes] = await Promise.all([
        $fetch<{ code: number; data: { list: NotificationItem[] } }>('/api/system/notification?pageSize=5'),
        $fetch<{ code: number; data: number }>('/api/system/notification/unread-count'),
      ])
      unreadCount.value = countRes.data
      return listRes.data.list
    } catch {
      return []
    }
  }

  // 启动轮询（仅客户端，全局只启动一次）
  if (import.meta.client && !pollingTimer) {
    pollingTimer = setInterval(refreshUnreadCount, 60_000)
  }

  return {
    unreadCount,
    refreshUnreadCount,
    fetchNotifications,
  }
}
