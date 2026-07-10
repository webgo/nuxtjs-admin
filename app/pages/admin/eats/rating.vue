<template>
  <div class="eats-rating-page">
    <el-card class="search-card">
      <el-form :model="filters" inline size="default">
        <el-form-item label="商家">
          <el-select v-model="filters.merchantId" placeholder="请选择" clearable style="width:200px" filterable remote :remote-method="searchMerchant" :loading="merchantLoading">
            <el-option v-for="m in merchantOptions" :key="m.id" :label="m.name" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="评分">
          <el-select v-model="filters.rating" placeholder="请选择" clearable style="width:100px">
            <el-option v-for="i in 5" :key="i" :label="`${i}星`" :value="i" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table :data="list" border stripe v-loading="loading">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="username" label="用户" width="120" />
        <el-table-column prop="productName" label="商品" min-width="130" />
        <el-table-column label="评分" width="100">
          <template #default="{ row }">
            <el-rate :model-value="row.rating" disabled show-score score-template="{value}" />
          </template>
        </el-table-column>
        <el-table-column prop="content" label="评价内容" min-width="250" show-overflow-tooltip />
        <el-table-column prop="createTime" label="评价时间" width="180">
          <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
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
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
import type { RatingItem, ApiResponse, PaginatedData } from '#shared/types/api'

const merchantOptions = ref<any[]>([])
const merchantLoading = ref(false)

const page = ref(1)
const pageSize = ref(10)
const filters = reactive({ merchantId: undefined as number | undefined, rating: undefined as number | undefined })

const { data, status, refresh } = useLazyFetch<ApiResponse<PaginatedData<RatingItem>>>('/api/eats/rating', {
  query: computed(() => ({ page: page.value, pageSize: pageSize.value, ...filters })),
})
const loading = computed(() => status.value === 'pending')
const list = computed(() => data.value?.data?.list ?? [])
const total = computed(() => data.value?.data?.total ?? 0)

async function loadMerchants(query?: string) {
  merchantLoading.value = true
  try {
    const res: any = await $fetch('/api/eats/merchant', { params: { page: 1, pageSize: 20, name: query || undefined } })
    merchantOptions.value = res.data.list
  } finally {
    merchantLoading.value = false
  }
}

function searchMerchant(query: string) {
  loadMerchants(query || undefined)
}

function handleSearch() { page.value = 1 }
function handleReset() { filters.merchantId = undefined; filters.rating = undefined; page.value = 1 }

async function handleDelete(row: any) {
  await ElMessageBox.confirm('确定删除该评价？', '提示', { type: 'warning' })
  await $fetch(`/api/eats/rating/${row.id}`, { method: 'DELETE' })
  ElMessage.success('删除成功')
  refresh()
}

function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleString('zh-CN')
}

onMounted(loadMerchants)
</script>

<style scoped>
.eats-rating-page { width: 100%; }
.search-card { margin-bottom: 16px; }
.table-pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
