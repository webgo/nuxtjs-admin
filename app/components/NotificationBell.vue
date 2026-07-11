<template>
  <el-popover ref="popoverRef" placement="bottom-end" :width="360" trigger="click">
    <template #reference>
      <el-badge :is-dot="unreadCount > 0" class="notification-badge">
        <el-icon :size="20" class="notification-icon" @click="handleOpen">
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
import { ElPopover } from 'element-plus'
import type { NotificationItem } from '#shared/types/api'

const router = useRouter()
const popoverRef = ref<InstanceType<typeof ElPopover>>()
const list = ref<NotificationItem[]>([])
const loading = ref(false)

const { unreadCount, refreshUnreadCount, fetchNotifications } = useNotification()

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

async function loadNotifications() {
  loading.value = true
  try {
    list.value = await fetchNotifications()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadNotifications()
})

function handleOpen() {
  loadNotifications()
}

async function handleRead(item: NotificationItem) {
  if (item.isRead === 0) {
    await $fetch(`/api/admin/notification/${item.id}/read`, { method: 'PUT' })
    item.isRead = 1
    refreshUnreadCount()
  }
}

async function handleReadAll() {
  await $fetch('/api/admin/notification/read-all', { method: 'PUT' })
  list.value.forEach(i => { i.isRead = 1 })
  refreshUnreadCount()
}

function goToPage() {
  popoverRef.value?.hide()
  router.push('/admin/system/notification')
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

.notification-icon {
  cursor: pointer;
  color: #909399;
  transition: color 0.2s;
}
.notification-icon:hover {
  color: #409eff;
}
</style>
