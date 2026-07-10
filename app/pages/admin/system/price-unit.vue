<template>
  <div class="price-unit-page">
    <el-card class="search-card">
      <el-form :model="filters" inline size="default">
        <el-form-item label="名称">
          <el-input v-model="filters.name" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="请选择" clearable style="width:100px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <div class="table-toolbar">
        <el-button type="primary" @click="handleAdd">新增单位</el-button>
      </div>
      <el-table :data="list" border stripe v-loading="loading">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="name" label="名称" min-width="120" />
        <el-table-column prop="symbol" label="符号" width="100">
          <template #default="{ row }">
            <span class="font-mono font-bold text-lg">{{ row.symbol }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="70" />
        <el-table-column label="状态" width="70">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row as any)">修改</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row as any)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑单位' : '新增单位'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="如：新台幣、美金" />
        </el-form-item>
        <el-form-item label="符号" prop="symbol">
          <el-input v-model="form.symbol" placeholder="如：NT$、$、¥" style="width:120px" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" />
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
import type { ApiResponse, PaginatedData } from '#shared/types/api'

interface PriceUnitRow {
  id: number
  name: string
  symbol: string
  sort: number
  status: number
  createTime: string
}

const dialogVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref()

const page = ref(1)
const pageSize = ref(10)
const filters = reactive({
  name: '',
  status: undefined as number | undefined,
})

const { data, status, refresh } = useLazyFetch<ApiResponse<PaginatedData<PriceUnitRow>>>('/api/system/price-unit', {
  query: computed(() => ({ page: page.value, pageSize: pageSize.value, ...filters })),
})
const loading = computed(() => status.value === 'pending')
const list = computed(() => data.value?.data?.list ?? [])
const total = computed(() => data.value?.data?.total ?? 0)

const form = reactive({
  id: 0,
  name: '',
  symbol: '',
  sort: 0,
  status: 1,
  remark: '',
})

const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  symbol: [{ required: true, message: '请输入符号', trigger: 'blur' }],
}

function handleSearch() { page.value = 1 }
function handleReset() { filters.name = ''; filters.status = undefined; page.value = 1 }

function handleAdd() {
  isEdit.value = false
  form.id = 0; form.name = ''; form.symbol = ''; form.sort = 0; form.status = 1; form.remark = ''
  dialogVisible.value = true
}

function handleEdit(row: PriceUnitRow) {
  isEdit.value = true
  Object.assign(form, row)
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    if (isEdit.value) {
      await $fetch(`/api/system/price-unit/${form.id}`, { method: 'PUT', body: { ...form } })
      ElMessage.success('更新成功')
    } else {
      await $fetch('/api/system/price-unit', { method: 'POST', body: { ...form } })
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

async function handleDelete(row: PriceUnitRow) {
  await ElMessageBox.confirm(`确定删除单位"${row.name}"？`, '提示', { type: 'warning' })
  await $fetch(`/api/system/price-unit/${row.id}`, { method: 'DELETE' })
  ElMessage.success('删除成功')
  refresh()
}

function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleString('zh-CN')
}
</script>

<style scoped>
.price-unit-page { width: 100%; }
.search-card { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; }
.table-pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
