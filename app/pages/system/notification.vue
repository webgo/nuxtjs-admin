<template>
  <div class="notification-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>消息通知</span>
          <el-button v-if="unreadCount > 0" type="primary" plain size="small" @click="handleReadAll">
            全部标记已读
          </el-button>
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="全部" name="all" />
        <el-tab-pane label="未读" name="unread" />
      </el-tabs>

      <div v-loading="loading">
        <div v-if="list.length === 0" style="text-align:center;padding:40px">
          <el-empty description="暂无通知" />
        </div>
        <div v-else class="notification-list">
          <div
            v-for="item in list"
            :key="item.id"
            class="notification-item"
            :class="{ unread: item.isRead === 0 }"
            @click="handleRead(item)"
          >
            <div class="item-left">
              <div class="item-dot" v-if="item.isRead === 0" />
            </div>
            <div class="item-body">
              <div class="item-header">
                <el-tag :type="tagType(item.type)" size="small">{{ typeLabel(item.type) }}</el-tag>
                <span class="item-time">{{ formatTime(item.createTime) }}</span>
              </div>
              <div class="item-title">{{ item.title }}</div>
              <div v-if="item.content" class="item-content">{{ item.content }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="table-pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next, jumper"
          @change="fetchData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import type { NotificationItem } from '#shared/types/api'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const list = ref<NotificationItem[]>([])
const total = ref(0)
const unreadCount = ref(0)
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const activeTab = ref('all')

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

function formatTime(t: string) {
  if (!t) return ''
  const d = new Date(t)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return d.toLocaleDateString('zh-CN')
}

async function fetchData() {
  loading.value = true
  try {
    const params: Record<string, unknown> = { page: page.value, pageSize: pageSize.value }
    if (activeTab.value === 'unread') params.isRead = 0

    const [listRes, countRes] = await Promise.all([
      $fetch<{ code: number; data: { list: NotificationItem[]; total: number } }>('/api/system/notification', { params }),
      $fetch<{ code: number; data: number }>('/api/system/notification/unread-count'),
    ])
    list.value = listRes.data.list
    total.value = listRes.data.total
    unreadCount.value = countRes.data
  } finally {
    loading.value = false
  }
}

function handleTabChange() {
  page.value = 1
  fetchData()
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

onMounted(() => fetchData())
</script>

<style scoped>
.notification-page {
  width: 100%;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.notification-list {
  border: 1px solid #ebeef5;
  border-radius: 4px;
}
.notification-item {
  display: flex;
  padding: 14px 16px;
  border-bottom: 1px solid #f2f2f2;
  cursor: pointer;
  transition: background 0.2s;
}
.notification-item:last-child {
  border-bottom: none;
}
.notification-item:hover {
  background: #f5f7fa;
}
.notification-item.unread {
  background: #f0f9ff;
}
.item-left {
  width: 12px;
  padding-top: 6px;
}
.item-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #409eff;
}
.item-body {
  flex: 1;
  min-width: 0;
}
.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.item-time {
  font-size: 12px;
  color: #999;
}
.item-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}
.item-content {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
  line-height: 1.5;
}
.table-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
