<template>
  <div class="eats-prod-cat-page">
    <el-card class="search-card">
      <el-form :model="filters" inline size="default">
        <el-form-item label="商家">
          <el-select v-model="filters.merchantId" placeholder="请选择商家" clearable style="width:200px" filterable remote :remote-method="searchMerchant" :loading="merchantLoading">
            <el-option v-for="m in merchantOptions" :key="m.id" :label="m.name" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="filters.name" placeholder="请输入名称" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <div class="table-toolbar">
        <el-button type="primary" @click="handleAdd">新增分类</el-button>
      </div>
      <el-table :data="list" border stripe v-loading="loading">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="name" label="分类名称" min-width="140" />
        <el-table-column prop="merchantName" label="所属商家" min-width="150" />
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">修改</el-button>
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑分类' : '新增分类'" width="500px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="所属商家" prop="merchantId">
          <el-select v-model="form.merchantId" placeholder="请选择商家" style="width:100%" filterable remote :remote-method="searchMerchant" :loading="merchantLoading" :disabled="isEdit">
            <el-option v-for="m in merchantOptions" :key="m.id" :label="m.name" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
import type { ProductCategoryItem, ApiResponse, PaginatedData } from '#shared/types/api'

const dialogVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref()
const merchantOptions = ref<any[]>([])
const merchantLoading = ref(false)

const page = ref(1)
const pageSize = ref(10)
const filters = reactive({ merchantId: undefined as number | undefined, name: '' })

const { data, status, refresh } = useLazyFetch<ApiResponse<PaginatedData<ProductCategoryItem>>>('/api/admin/product-category', {
  query: computed(() => ({ page: page.value, pageSize: pageSize.value, ...filters })),
})
const loading = computed(() => status.value === 'pending')
const list = computed(() => data.value?.data?.list ?? [])
const total = computed(() => data.value?.data?.total ?? 0)

const form = reactive({ id: 0, name: '', merchantId: undefined as number | undefined, sort: 0 })

const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  merchantId: [{ required: true, message: '请选择商家', trigger: 'change' }],
}

async function loadMerchants(query?: string) {
  merchantLoading.value = true
  try {
    const res: any = await $fetch('/api/admin/merchant', { params: { page: 1, pageSize: 20, name: query || undefined } })
    merchantOptions.value = res.data.list
    // 自动选中第一个商家，避免页面加载无数据
    if (res.data.list?.length && filters.merchantId === undefined) {
      filters.merchantId = res.data.list[0].id
    }
  } finally {
    merchantLoading.value = false
  }
}

function searchMerchant(query: string) {
  loadMerchants(query || undefined)
}

function handleSearch() { page.value = 1 }
function handleReset() { filters.merchantId = undefined; filters.name = ''; page.value = 1; loadMerchants() }

function handleAdd() {
  isEdit.value = false
  form.id = 0; form.name = ''; form.merchantId = undefined; form.sort = 0
  dialogVisible.value = true
}

function handleEdit(row: any) {
  isEdit.value = true
  form.id = row.id; form.name = row.name; form.merchantId = row.merchantId; form.sort = row.sort
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    if (isEdit.value) {
      await $fetch(`/api/admin/product-category/${form.id}`, { method: 'PUT', body: { name: form.name, sort: form.sort } })
      ElMessage.success('更新成功')
    } else {
      await $fetch('/api/admin/product-category', { method: 'POST', body: { ...form, id: undefined } })
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    refresh()
  } catch (err: any) {
    ElMessage.error(err.data?.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm(`确定删除分类"${row.name}"？`, '提示', { type: 'warning' })
  await $fetch(`/api/admin/product-category/${row.id}`, { method: 'DELETE' })
  ElMessage.success('删除成功')
  refresh()
}

onMounted(loadMerchants)
</script>

<style scoped>
.eats-prod-cat-page { width: 100%; }
.search-card { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; }
.table-pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
