<template>
  <div class="category-page">
    <el-card class="search-card">
      <el-form :model="query" inline size="default">
        <el-form-item label="分类名称">
          <el-input v-model="query.name" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="标识">
          <el-input v-model="query.code" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="请选择" clearable style="width:120px">
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
        <el-button type="primary" @click="handleAdd">新增分类</el-button>
      </div>
      <el-table :data="categoryList" border stripe v-loading="loading">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="name" label="分类名称" min-width="150" />
        <el-table-column prop="code" label="标识" width="160" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
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
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">修改</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="table-pagination">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          layout="total, prev, pager, next, jumper"
          @change="fetchData"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑分类' : '新增分类'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="标识" prop="code">
          <el-input v-model="form.code" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" />
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
import type { CategoryItem, ApiResponse, PaginatedData } from '#shared/types/api'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const categoryList = ref<CategoryItem[]>([])
const total = ref(0)
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref()

const query = reactive({
  page: 1,
  pageSize: 10,
  name: '',
  code: '',
  status: undefined as number | undefined,
})

const form = reactive({
  id: 0,
  name: '',
  code: '',
  description: '',
  sort: 0,
  status: 1,
  remark: '',
})

const rules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入分类标识', trigger: 'blur' }],
}

async function fetchData() {
  loading.value = true
  try {
    const res = await $fetch<ApiResponse<PaginatedData<CategoryItem>>>('/api/system/category', { params: query })
    categoryList.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

function handleSearch() { query.page = 1; fetchData() }
function handleReset() { query.name = ''; query.code = ''; query.status = undefined; query.page = 1; fetchData() }

function handleAdd() {
  isEdit.value = false
  form.id = 0; form.name = ''; form.code = ''; form.description = ''; form.sort = 0; form.status = 1; form.remark = ''
  dialogVisible.value = true
}

function handleEdit(row: any) {
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
      await $fetch(`/api/system/category/${form.id}`, { method: 'PUT', body: { ...form } })
      ElMessage.success('更新成功')
    } else {
      await $fetch('/api/system/category', { method: 'POST', body: { ...form } })
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchData()
  } catch (err: any) {
    ElMessage.error(err.data?.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm(`确定删除分类"${row.name}"？`, '提示', { type: 'warning' })
  await $fetch(`/api/system/category/${row.id}`, { method: 'DELETE' })
  ElMessage.success('删除成功')
  fetchData()
}

function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleString('zh-CN')
}

onMounted(() => fetchData())
</script>

<style scoped>
.category-page { width: 100%; }
.search-card { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; }
.table-pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
