<template>
  <div class="eats-order-page">
    <el-card class="search-card">
      <el-form :model="filters" inline size="default">
        <el-form-item label="订单号">
          <el-input v-model="filters.orderNo" placeholder="请输入订单号" clearable />
        </el-form-item>
        <el-form-item label="商家">
          <el-select v-model="filters.merchantId" placeholder="请选择" clearable style="width:200px" filterable remote :remote-method="searchMerchant" :loading="merchantLoading">
            <el-option v-for="m in merchantOptions" :key="m.id" :label="m.name" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="请选择" clearable style="width:130px">
            <el-option label="待付款" value="pending" />
            <el-option label="已付款" value="paid" />
            <el-option label="准备中" value="preparing" />
            <el-option label="配送中" value="delivering" />
            <el-option label="已送达" value="delivered" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
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
        <el-table-column prop="orderNo" label="订单号" width="180" />
        <el-table-column prop="merchantName" label="商家" width="130" />
        <el-table-column label="金额" width="100">
          <template #default="{ row }">¥{{ row.totalAmount }}</template>
        </el-table-column>
        <el-table-column label="配送方式" width="90">
          <template #default="{ row }">{{ row.deliveryType === 'pickup' ? '自取' : '外送' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="contactName" label="联系人" width="100" />
        <el-table-column prop="contactPhone" label="联系电话" width="130" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleDetail(row)">详情</el-button>
            <el-button v-if="row.status === 'pending'" type="warning" link size="small" @click="handleStatus(row, 'paid')">确认付款</el-button>
            <el-button v-if="row.status === 'paid'" type="primary" link size="small" @click="handleStatus(row, 'preparing')">开始准备</el-button>
            <el-button v-if="row.status === 'preparing'" type="primary" link size="small" @click="handleStatus(row, 'delivering')">开始配送</el-button>
            <el-button v-if="row.status === 'delivering'" type="success" link size="small" @click="handleStatus(row, 'delivered')">确认送达</el-button>
            <el-button v-if="['pending','paid','preparing'].includes(row.status)" type="danger" link size="small" @click="handleStatus(row, 'cancelled')">取消</el-button>
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

    <el-dialog v-model="detailVisible" title="订单详情" width="600px" :close-on-click-modal="false">
      <template v-if="detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">{{ detail.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusType(detail.status)" size="small">{{ statusLabel(detail.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="商家">{{ detail.merchantName }}</el-descriptions-item>
          <el-descriptions-item label="配送方式">{{ detail.deliveryType === 'pickup' ? '自取' : '外送' }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ detail.contactName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ detail.contactPhone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="配送地址" :span="2">{{ detail.deliveryAddress || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ detail.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
        <el-table :data="detail.items" border stripe size="small" style="margin-top:12px">
          <el-table-column prop="productName" label="商品" min-width="140" />
          <el-table-column prop="specName" label="规格" width="80" />
          <el-table-column label="单价" width="80">
            <template #default="{ row }">¥{{ row.price }}</template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="60" />
          <el-table-column label="小计" width="80">
            <template #default="{ row }">¥{{ row.subtotal }}</template>
          </el-table-column>
        </el-table>
        <div style="text-align:right;margin-top:8px;font-size:16px;font-weight:bold">
          总计：¥{{ detail.totalAmount }}
        </div>
      </template>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
import type { OrderItem, ApiResponse, PaginatedData } from '#shared/types/api'

const detailVisible = ref(false)
const detail = ref<any>(null)
const merchantOptions = ref<any[]>([])
const merchantLoading = ref(false)

const page = ref(1)
const pageSize = ref(10)
const filters = reactive({ orderNo: '', merchantId: undefined as number | undefined, status: '' })

const { data, status, refresh } = useLazyFetch<ApiResponse<PaginatedData<OrderItem>>>('/api/eats/order', {
  query: computed(() => ({ page: page.value, pageSize: pageSize.value, ...filters })),
})
const loading = computed(() => status.value === 'pending')
const list = computed(() => data.value?.data?.list ?? [])
const total = computed(() => data.value?.data?.total ?? 0)

function statusLabel(s: string) {
  const map: Record<string, string> = { pending: '待付款', paid: '已付款', preparing: '准备中', delivering: '配送中', delivered: '已送达', completed: '已完成', cancelled: '已取消' }
  return map[s] || s
}
function statusType(s: string) {
  const map: Record<string, "success" | "warning" | "info" | "danger" | "primary"> = { pending: 'warning', paid: 'primary', preparing: 'info', delivering: 'primary', delivered: 'success', completed: 'success', cancelled: 'info' }
  return (map[s] || 'info') as "success" | "warning" | "info" | "danger" | "primary"
}

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
function handleReset() { filters.orderNo = ''; filters.merchantId = undefined; filters.status = ''; page.value = 1 }

async function handleDetail(row: any) {
  const res: any = await $fetch(`/api/eats/order/${row.id}`)
  detail.value = res.data
  detailVisible.value = true
}

async function handleStatus(row: any, newStatus: string) {
  await ElMessageBox.confirm(`确定将订单"${row.orderNo}"状态变更为"${statusLabel(newStatus)}"？`, '提示', { type: 'warning' })
  await $fetch(`/api/eats/order/${row.id}/status`, { method: 'PUT', body: { status: newStatus } })
  ElMessage.success('状态更新成功')
  refresh()
}

onMounted(loadMerchants)
</script>

<style scoped>
.eats-order-page { width: 100%; }
.search-card { margin-bottom: 16px; }
.table-pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
