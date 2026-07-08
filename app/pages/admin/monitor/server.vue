<template>
  <div class="monitor-page">
    <!-- 统计卡片 -->
    <el-row :gutter="16">
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-body">
            <div class="stat-icon uptime"><Timer /></div>
            <div class="stat-info">
              <div class="stat-value">{{ formatUptime(data.uptime) }}</div>
              <div class="stat-label">系统已运行</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-body">
            <div class="stat-icon memory"><Cpu /></div>
            <div class="stat-info">
              <div class="stat-value">{{ formatBytes(data.memory?.rss) }}</div>
              <div class="stat-label">内存使用 (RSS)</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-body">
            <div class="stat-icon cpu"><Monitor /></div>
            <div class="stat-info">
              <div class="stat-value">{{ data.cpu?.cores }} 核</div>
              <div class="stat-label">CPU 核心数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-body">
            <div class="stat-icon node"><Connection /></div>
            <div class="stat-info">
              <div class="stat-value">{{ data.runtime?.nodeVersion }}</div>
              <div class="stat-label">Node.js 版本</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 内存详情 + 数据库状态 -->
    <el-row :gutter="16" class="row-gap">
      <el-col :xs="24" :lg="14">
        <el-card shadow="never">
          <template #header><span>内存使用详情</span></template>
          <div class="memory-detail">
            <div class="mem-row">
              <span class="mem-label">总内存</span>
              <span class="mem-value">{{ formatBytes(data.memory?.total) }}</span>
            </div>
            <div class="mem-row">
              <span class="mem-label">已用内存</span>
              <span class="mem-value">{{ formatBytes((data.memory?.total ?? 0) - (data.memory?.free ?? 0)) }} ({{ data.memory?.usagePercent }}%)</span>
            </div>
            <div class="mem-row">
              <span class="mem-label">空闲内存</span>
              <span class="mem-value">{{ formatBytes(data.memory?.free) }}</span>
            </div>
            <el-progress
              :percentage="Number(data.memory?.usagePercent) || 0"
              :color="memColor"
              striped
              striped-flow
              :duration="6"
            />
            <el-divider />
            <div class="mem-row">
              <span class="mem-label">进程 RSS</span>
              <span class="mem-value">{{ formatBytes(data.memory?.rss) }}</span>
            </div>
            <div class="mem-row">
              <span class="mem-label">堆总大小</span>
              <span class="mem-value">{{ formatBytes(data.memory?.heapTotal) }}</span>
            </div>
            <div class="mem-row">
              <span class="mem-label">堆已用</span>
              <span class="mem-value">{{ formatBytes(data.memory?.heapUsed) }}</span>
            </div>
            <div class="mem-row">
              <span class="mem-label">外部内存</span>
              <span class="mem-value">{{ formatBytes(data.memory?.external) }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="10">
        <el-card shadow="never">
          <template #header><span>数据库状态</span></template>
          <div class="db-status">
            <div class="db-row">
              <span>连接状态</span>
              <el-tag :type="dbStatusType" size="default">
                {{ data.database?.status === 'connected' ? '已连接' : '已断开' }}
              </el-tag>
            </div>
            <el-divider />
            <div class="db-row">
              <span>数据库版本</span>
              <span class="db-version">{{ data.database?.version || '-' }}</span>
            </div>
            <el-divider />
            <div class="db-row">
              <span>主机已运行</span>
              <span class="db-version">{{ formatUptime(data.osUptime) }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 系统信息 -->
    <el-row :gutter="16" class="row-gap">
      <el-col :span="24">
        <el-card shadow="never">
          <template #header><span>系统信息</span></template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="服务器名称">{{ data.os?.hostname }}</el-descriptions-item>
            <el-descriptions-item label="操作系统">{{ osPlatformText }} {{ data.os?.release }}</el-descriptions-item>
            <el-descriptions-item label="CPU 架构">{{ data.cpu?.arch }}</el-descriptions-item>
            <el-descriptions-item label="CPU 型号">{{ data.cpu?.model }}</el-descriptions-item>
            <el-descriptions-item label="Node 进程 ID">{{ data.runtime?.pid }}</el-descriptions-item>
            <el-descriptions-item label="运行目录">{{ data.runtime?.cwd }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { Timer, Cpu, Monitor, Connection } from '@element-plus/icons-vue'
import type { SystemMonitorData, ApiResponse } from '#shared/types/api'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const data = ref<SystemMonitorData>({
  uptime: 0,
  osUptime: 0,
  memory: null,
  cpu: null,
  os: null,
  runtime: null,
  database: null,
})

const osPlatformText = computed(() => {
  const m: Record<string, string> = {
    win32: 'Windows',
    linux: 'Linux',
    darwin: 'macOS',
    freebsd: 'FreeBSD',
  }
  return m[data.value.os?.platform || ''] || data.value.os?.platform || ''
})

const dbStatusType = computed(() =>
  data.value.database?.status === 'connected' ? 'success' : 'danger'
)

function memColor(percent: number) {
  if (percent > 80) return '#f56c6c'
  if (percent > 60) return '#e6a23c'
  return '#67c23a'
}

function formatUptime(seconds: number): string {
  if (!seconds && seconds !== 0) return '-'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const parts: string[] = []
  if (d > 0) parts.push(`${d} 天`)
  if (h > 0) parts.push(`${h} 小时`)
  if (m > 0) parts.push(`${m} 分`)
  parts.push(`${s} 秒`)
  return parts.join(' ')
}

function formatBytes(bytes: number | undefined | null): string {
  if (bytes === undefined || bytes === null) return '-'
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i]
}

async function fetchData() {
  try {
    const res = await $fetch<ApiResponse<SystemMonitorData>>('/api/system/monitor')
    data.value = res.data
  } catch (err: any) {
    ElMessage.error(err.data?.message || '获取监控数据失败')
  }
}

onMounted(() => fetchData())
</script>

<style scoped>
.monitor-page { width: 100%; }
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
.stat-icon.uptime { background: #ecf5ff; color: #409eff; }
.stat-icon.memory { background: #f0f9eb; color: #67c23a; }
.stat-icon.cpu { background: #fdf6ec; color: #e6a23c; }
.stat-icon.node { background: #fef0f0; color: #f56c6c; }
.stat-info { min-width: 0; }
.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
  line-height: 1.4;
  word-break: break-all;
}
.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 2px;
}

.memory-detail { padding: 0 4px; }
.mem-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 14px;
}
.mem-label { color: #606266; }
.mem-value { color: #303133; font-weight: 500; }

.db-status { padding: 0 4px; }
.db-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #303133;
}
.db-version { color: #606266; font-family: monospace; }
</style>
