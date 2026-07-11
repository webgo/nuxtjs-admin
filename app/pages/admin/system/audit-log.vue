<template>
  <div class="audit-log-page">
    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-form :model="filters" inline size="default">
        <el-form-item label="操作人">
          <el-input v-model="filters.username" placeholder="用户名" clearable style="width:140px" />
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select v-model="filters.action" placeholder="全部" clearable style="width:120px">
            <el-option label="创建" value="CREATE" />
            <el-option label="修改" value="UPDATE" />
            <el-option label="删除" value="DELETE" />
            <el-option label="登录" value="LOGIN" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标模块">
          <el-select v-model="filters.target" placeholder="全部" clearable style="width:120px">
            <el-option label="用户" value="user" />
            <el-option label="角色" value="role" />
            <el-option label="权限" value="permission" />
            <el-option label="字典" value="dict-type" />
            <el-option label="内容" value="content" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table :data="list" border stripe v-loading="status === 'pending'" max-height="600">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="username" label="操作人" width="120" />
        <el-table-column label="操作类型" width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.action === 'CREATE' ? 'success' : row.action === 'DELETE' ? 'danger' : 'warning'"
              size="small"
            >
              {{ ({ CREATE: '创建', UPDATE: '修改', DELETE: '删除', LOGIN: '登录' } as Record<string, string>)[row.action] || row.action }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="target" label="目标模块" width="100" />
        <el-table-column prop="targetId" label="目标ID" width="80" />
        <el-table-column prop="detail" label="操作详情" min-width="200">
          <template #default="{ row }">
            <span class="detail-text">{{ row.detail || '-' }}</span>
            <el-button v-if="row.detail" link type="primary" size="small" @click="openDetail(row as unknown as AuditLogItem)" style="margin-left:4px">
              <el-icon><View /></el-icon>
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP" width="140" />
        <el-table-column prop="createTime" label="时间" width="180">
          <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
        </el-table-column>
      </el-table>
      <div class="table-pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next, jumper"
        />
      </div>
    </el-card>

    <!-- JSON 详情对话框 -->
    <el-dialog v-model="detailDialogVisible" :title="detailTitle" width="700px" destroy-on-close>
      <div class="json-detail-toolbar">
        <el-button size="small" @click="copyDetail">复制</el-button>
      </div>
      <pre class="json-viewer">{{ formattedDetail }}</pre>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import type { AuditLogItem } from '#shared/types/api'
import { View } from '@element-plus/icons-vue'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const detailDialogVisible = ref(false)
const detailJson = ref('')
const detailTitle = ref('')

const page = ref(1)
const pageSize = ref(20)
const filters = reactive({
  username: '',
  action: undefined as string | undefined,
  target: undefined as string | undefined,
})

const { data, status, refresh } = useLazyFetch('/api/admin/audit-log', {
  query: computed(() => ({ page: page.value, pageSize: pageSize.value, ...filters })),
})
const list = computed(() => (data.value as any)?.data?.list ?? [])
const total = computed(() => (data.value as any)?.data?.total ?? 0)

function handleSearch() {
  page.value = 1
}

function handleReset() {
  filters.username = ''
  filters.action = undefined
  filters.target = undefined
  page.value = 1
}

function formatTime(t: string) {
  if (!t) return ''
  return new Date(t).toLocaleString('zh-CN')
}

const formattedDetail = computed(() => {
  if (!detailJson.value) return ''
  try {
    return JSON.stringify(JSON.parse(detailJson.value), null, 2)
  } catch {
    return detailJson.value
  }
})

function openDetail(row: AuditLogItem) {
  detailJson.value = row.detail || ''
  detailTitle.value = `操作详情 - ${row.action} (${row.target}#${row.targetId ?? '-'})`
  detailDialogVisible.value = true
}

async function copyDetail() {
  try {
    await navigator.clipboard.writeText(formattedDetail.value)
    ElMessage.success('已复制')
  } catch {
    ElMessage.error('复制失败')
  }
}

// useLazyFetch auto-fetches on mount
</script>

<style scoped>
.audit-log-page {
  width: 100%;
}
.search-card {
  margin-bottom: 16px;
}
.table-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.detail-text {
  display: inline-block;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}
.json-detail-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}
.json-viewer {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.6;
  max-height: 420px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  margin: 0;
}
</style>
