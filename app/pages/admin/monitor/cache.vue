<template>
  <div class="cache-page">
    <!-- 概览卡片 -->
    <el-row :gutter="16">
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-body">
            <div class="stat-icon version"><Coin /></div>
            <div class="stat-info">
              <div class="stat-value">{{ info.version || '-' }}</div>
              <div class="stat-label">缓存版本</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-body">
            <div class="stat-icon memory"><Cpu /></div>
            <div class="stat-info">
              <div class="stat-value">{{ info.usedMemoryHuman || '-' }}</div>
              <div class="stat-label">已用内存</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-body">
            <div class="stat-icon keys"><Collection /></div>
            <div class="stat-info">
              <div class="stat-value">{{ info.totalKeys }}</div>
              <div class="stat-label">Key 总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-body">
            <div class="stat-icon hit"><DataBoard /></div>
            <div class="stat-info">
              <div class="stat-value">{{ info.hitRate }}</div>
              <div class="stat-label">缓存命中率</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 详情信息 -->
    <el-row :gutter="16" class="row-gap">
      <el-col :span="24">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>缓存数据管理</span>
              <div class="header-actions">
                <el-button
                  v-if="(info as Record<string, unknown>).available"
                  type="danger"
                  plain
                  size="small"
                  @click="handleClearAll"
                >
                  清空全部缓存
                </el-button>
              </div>
            </div>
          </template>

          <!-- Key 搜索 -->
          <el-form :inline="true">
            <el-form-item label="Key Pattern">
              <el-input v-model="keyPattern" placeholder="如: online_user:*" style="width: 260px" clearable @clear="handleSearchKeys">
                <template #append>
                  <el-button @click="handleSearchKeys">
                    <el-icon><Search /></el-icon>
                  </el-button>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item label="常用">
              <el-radio-group v-model="keyPattern" @change="handleSearchKeys" size="small">
                <el-radio-button value="*">全部 (*)</el-radio-button>
                <el-radio-button value="online_user:*">在线用户</el-radio-button>
                <el-radio-button value="online_token:*">用户令牌</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-form>

          <!-- Key 列表 -->
          <el-table v-loading="keysLoading" :data="keyList" stripe border>
            <el-table-column label="Key" min-width="300">
              <template #default="{ row }">
                <code class="key-name">{{ row.key }}</code>
              </template>
            </el-table-column>
            <el-table-column prop="type" label="类型" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="typeTag(row.type)" size="small">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="TTL" width="100" align="center">
              <template #default="{ row }">
                <span v-if="row.ttl === -1" style="color: #999">永不过期</span>
                <span v-else>{{ formatTtl(row.ttl) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="size" label="大小" width="120" align="center" />
            <el-table-column label="操作" width="160" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="handleViewKey(row as CacheKeyItem)">查看</el-button>
                <el-button type="danger" link size="small" @click="handleDeleteKey(row as CacheKeyItem)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="table-pagination">
            <el-pagination
              v-model:current-page="keyPage"
              v-model:page-size="keyPageSize"
              :total="keyTotal"
              layout="total, prev, pager, next, jumper"
              @change="handleSearchKeys"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Key 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="Key 详情" width="700px" top="5vh">
      <template v-if="detailData">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="Key" :span="2">
            <code class="detail-key">{{ detailData.key }}</code>
          </el-descriptions-item>
          <el-descriptions-item label="类型">{{ detailData.type }}</el-descriptions-item>
          <el-descriptions-item label="TTL">
            {{ detailData.ttl === -1 ? '永不过期' : formatTtl(detailData.ttl) }}
          </el-descriptions-item>
        </el-descriptions>
        <el-divider />
        <div class="detail-label">Value</div>
        <el-input
          type="textarea"
          :rows="12"
          :model-value="detailData.value"
          readonly
          class="detail-value"
        />
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { Coin, Cpu, Collection, DataBoard, Search } from '@element-plus/icons-vue'
import type { ApiResponse, CacheInfoData, CacheKeyItem } from '#shared/types/api'

definePageMeta({ layout: 'admin', middleware: 'auth' })

// 缓存信息
const info = ref<CacheInfoData>({
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
})

// Key 搜索
const keyPattern = ref('*')
const keyList = ref<CacheKeyItem[]>([])
const keyTotal = ref(0)
const keyPage = ref(1)
const keyPageSize = ref(50)
const keysLoading = ref(false)

// Key 详情
const detailVisible = ref(false)
const detailData = ref<{ key: string; type: string; ttl: number; value: string } | null>(null)

function typeTag(type: string): 'success' | 'warning' | 'info' | 'primary' | 'danger' {
  const map: Record<string, 'success' | 'warning' | 'info' | 'primary' | 'danger'> = {
    string: 'success',
    list: 'warning',
    set: 'info',
    hash: 'primary',
    zset: 'danger',
  }
  return map[type] || 'info'
}

function formatTtl(seconds: number): string {
  if (seconds <= 0) return '0s'
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  return `${Math.floor(seconds / 86400)}d`
}

// 获取缓存概览
async function fetchInfo() {
  try {
    const res = await $fetch<ApiResponse<CacheInfoData & { available?: boolean }>>('/api/system/cache')
    if (res.data && res.data.available !== false) {
      info.value = res.data as CacheInfoData
    }
  } catch {
    // 缓存不可用时保持默认值
  }
}

// 搜索 Key
async function handleSearchKeys() {
  keyPage.value = 1
  await loadKeys()
}

async function loadKeys() {
  keysLoading.value = true
  try {
    const res = await $fetch<ApiResponse<{ list: CacheKeyItem[]; total: number; page: number; pageSize: number }>>('/api/system/cache/keys', {
      params: {
        pattern: keyPattern.value,
        page: keyPage.value,
        pageSize: keyPageSize.value,
      },
    })
    keyList.value = res.data.list
    keyTotal.value = res.data.total
  } catch {
    ElMessage.error('获取 Key 列表失败')
  } finally {
    keysLoading.value = false
  }
}

// 查看 Key 详情
async function handleViewKey(row: CacheKeyItem) {
  try {
    const res = await $fetch<ApiResponse<{ key: string; type: string; ttl: number; value: string }>>(`/api/system/cache/${encodeURIComponent(row.key)}`)
    detailData.value = res.data
    detailVisible.value = true
  } catch (err: any) {
    ElMessage.error(err?.data?.message || '获取 Key 详情失败')
  }
}

// 删除 Key
async function handleDeleteKey(row: CacheKeyItem) {
  try {
    await ElMessageBox.confirm(`确定删除 Key「${row.key}」吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await $fetch(`/api/system/cache/${encodeURIComponent(row.key)}`, { method: 'DELETE' })
    ElMessage.success('删除成功')
    loadKeys()
  } catch {
    // 取消操作不处理
  }
}

// 清空全部缓存
async function handleClearAll() {
  try {
    await ElMessageBox.confirm('确定清空全部缓存吗？此操作不可恢复！', '警告', {
      confirmButtonText: '确定清空',
      cancelButtonText: '取消',
      type: 'error',
      confirmButtonClass: 'el-button--danger',
    })
    await $fetch('/api/system/cache/clear', { method: 'DELETE' })
    ElMessage.success('缓存已全部清空')
    fetchInfo()
    loadKeys()
  } catch {
    // 取消操作不处理
  }
}

onMounted(() => {
  fetchInfo()
  loadKeys()
})
</script>

<style scoped>
.cache-page { width: 100%; }
.row-gap { margin-top: 16px; }

.stat-card { border-radius: 6px; }
.stat-body {
  display: flex;
  align-items: center;
  gap: 16px;
}
.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}
.stat-icon.version { background: #ecf5ff; color: #409eff; }
.stat-icon.memory { background: #f0f9eb; color: #67c23a; }
.stat-icon.keys { background: #fdf6ec; color: #e6a23c; }
.stat-icon.hit { background: #fef0f0; color: #f56c6c; }
.stat-info { min-width: 0; }
.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
  line-height: 1.4;
}
.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 2px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-actions {
  display: flex;
  gap: 8px;
}

.key-name {
  font-size: 13px;
  font-family: 'Consolas', 'Courier New', monospace;
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 3px;
}

.table-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.detail-label {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.detail-key {
  word-break: break-all;
  word-wrap: break-word;
  white-space: pre-wrap;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 13px;
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 3px;
}
.detail-value {
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 13px;
}
</style>
