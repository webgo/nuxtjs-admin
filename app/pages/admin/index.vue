<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="6" v-for="stat in stats" :key="stat.label">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </el-card>
      </el-col>
    </el-row>


  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from '#shared/types/api'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

interface StatItem {
  label: string
  value: string | number
}

const stats = ref<StatItem[]>([
  { label: '用户数', value: '-' },
  { label: '角色数', value: '-' },
  { label: '菜单数', value: '-' },
  { label: '字典数', value: '-' },
])

onMounted(async () => {
  try {
    const [userRes, roleRes, permRes, dictRes] = await Promise.all([
      $fetch<ApiResponse<{ total: number }>>('/api/system/user?page=1&pageSize=1'),
      $fetch<ApiResponse<{ total: number }>>('/api/system/role?page=1&pageSize=1'),
      $fetch<ApiResponse<unknown[]>>('/api/system/permission'),
      $fetch<ApiResponse<{ total: number }>>('/api/system/dict-type?page=1&pageSize=1'),
    ])
    stats.value = [
      { label: '用户数', value: userRes.data.total },
      { label: '角色数', value: roleRes.data.total },
      { label: '菜单数', value: permRes.data.length },
      { label: '字典数', value: dictRes.data.total },
    ]
  } catch (err) {
    console.warn('Dashboard load failed:', err)
  }
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stat-card {
  text-align: center;
  cursor: pointer;
}

.stat-value {
  font-size: 36px;
  font-weight: bold;
  color: #409eff;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
}
</style>
