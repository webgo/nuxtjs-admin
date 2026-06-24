<template>
  <el-popover placement="bottom-end" :width="360" trigger="click" :visible="popoverVisible">
    <template #reference>
      <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="notification-badge">
        <el-icon :size="20" style="cursor:pointer" @click="handleOpen">
          <BellFilled />
        </el-icon>
      </el-badge>
    </template>

    <div class="notification-panel">
      <div class="notification-header">
        <span class="notification-title">消息通知</span>
        <el-button v-if="unreadCount > 0" type="primary" link size="small" @click="handleReadAll">
          全部标记已读
        </el-button>
      </div>
      <div v-if="loading" class="notification-loading">
        <el-skeleton :rows="3" animated />
      </div>
      <div v-else-if="list.length === 0" class="notification-empty">
        <el-empty description="暂无通知" :image-size="60" />
      </div>
      <div v-else class="notification-list">
        <div
          v-for="item in list"
          :key="item.id"
          class="notification-item"
          :class="{ unread: item.isRead === 0 }"
          @click="handleRead(item)"
        >
          <div class="notification-item-header">
            <el-tag :type="tagType(item.type)" size="small" effect="plain">
              {{ typeLabel(item.type) }}
            </el-tag>
            <span class="notification-time">{{ formatTime(item.createTime) }}</span>
          </div>
          <div class="notification-item-title">{{ item.title }}</div>
          <div v-if="item.content" class="notification-item-content">{{ item.content }}</div>
        </div>
      </div>
      <div class="notification-footer">
        <el-button type="primary" link size="small" @click="goToPage">查看全部</el-button>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { BellFilled } from '@element-plus/icons-vue'
import type { NotificationItem } from '#shared/types/api'

const router = useRouter()
const popoverVisible = ref(false)
const list = ref<NotificationItem[]>([])
const unreadCount = ref(0)
const loading = ref(false)

function tagType(type: string): 'success' | 'warning' | 'info' {
  if (type === 'system') return 'info'
  if (type === 'approval') return 'warning'
  return 'success'
}

function typeLabel(type: string): string {
  if (type === 'system') return '系统'
  if (type === 'approval') return '审批'
  return '提醒'
}

function formatTime(t: string): string {
  if (!t) return ''
  const d = new Date(t)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return d.toLocaleDateString('zh-CN')
}

async function fetchNotifications() {
  loading.value = true
  try {
    const [listRes, countRes] = await Promise.all([
      $fetch<{ code: number; data: { list: NotificationItem[] } }>('/api/system/notification?pageSize=5'),
      $fetch<{ code: number; data: number }>('/api/system/notification/unread-count'),
    ])
    list.value = listRes.data.list
    unreadCount.value = countRes.data
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
}

function handleOpen() {
  popoverVisible.value = true
  fetchNotifications()
}

async function handleRead(item: NotificationItem) {
  if (item.isRead === 0) {
    await $fetch(`/api/system/notification/${item.id}/read`, { method: 'PUT' })
    item.isRead = 1
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  }
}

async function handleReadAll() {
  await $fetch('/api/system/notification/read-all', { method: 'PUT' })
  unreadCount.value = 0
  list.value.forEach(i => { i.isRead = 1 })
}

function goToPage() {
  popoverVisible.value = false
  router.push('/system/notification')
}
</script>

<style scoped>
.notification-badge {
  margin-right: 16px;
  cursor: pointer;
}

.notification-panel {
  max-height: 420px;
  display: flex;
  flex-direction: column;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.notification-title {
  font-weight: 600;
  font-size: 14px;
}

.notification-loading {
  padding: 16px;
}

.notification-empty {
  padding: 16px;
}

.notification-list {
  max-height: 320px;
  overflow-y: auto;
}

.notification-item {
  padding: 10px 4px;
  border-bottom: 1px solid #f2f2f2;
  cursor: pointer;
  transition: background 0.2s;
}

.notification-item:hover {
  background: #f5f7fa;
}

.notification-item.unread {
  background: #f0f9ff;
}

.notification-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.notification-time {
  font-size: 12px;
  color: #999;
}

.notification-item-title {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.notification-item-content {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-footer {
  text-align: center;
  padding-top: 8px;
  border-top: 1px solid #ebeef5;
}
</style>
