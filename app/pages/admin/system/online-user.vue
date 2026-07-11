<template>
  <div class="page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>在线用户</span>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :inline="true" @keyup.enter="handleSearch">
        <el-form-item label="用户名">
          <el-input v-model="keyword" placeholder="请输入用户名" clearable @clear="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 表格 -->
      <el-table v-loading="status === 'pending'" :data="list" stripe border>
        <el-table-column prop="userId" label="用户ID" width="80" align="center" />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="nickname" label="昵称" min-width="120" />
        <el-table-column label="登录IP" min-width="140">
          <template #default="{ row }">
            <span>{{ row.ip || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="登录时间" width="180">
          <template #default="{ row }">
            <span>{{ row.loginTime ? new Date(row.loginTime).toLocaleString('zh-CN') : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              type="danger"
              link
              size="small"
              :disabled="row.userId === authStore.user?.id"
              @click="handleForceLogout(row as OnlineUserItem)"
            >
              强退
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next, jumper"
          @change="() => refresh()"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse, PaginatedData, OnlineUserItem } from '#shared/types/api'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const authStore = useAuthStore()

const page = ref(1)
const pageSize = ref(20)
const keyword = ref('')

const q = computed(() => {
  const params: Record<string, unknown> = { page: page.value, pageSize: pageSize.value }
  if (keyword.value) params.username = keyword.value
  return params
})
const { data, status, refresh } = useLazyFetch<ApiResponse<PaginatedData<OnlineUserItem>>>('/api/admin/online-user', {
  query: q,
})
const list = computed(() => data.value?.data?.list ?? [])
const total = computed(() => data.value?.data?.total ?? 0)

function handleSearch() {
  page.value = 1
}

function handleReset() {
  keyword.value = ''
  page.value = 1
}

async function handleForceLogout(row: OnlineUserItem) {
  try {
    await ElMessageBox.confirm(`确定将用户「${row.username}」强制下线吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await $fetch(`/api/admin/online-user/${row.userId}`, { method: 'DELETE' })
    ElMessage.success('强制下线成功')
    refresh()
  } catch {
    // 取消操作不处理
  }
}

// useLazyFetch auto-fetches on mount
</script>

<style scoped>
.page {
  width: 100%;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.table-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
