<template>
  <div class="dict-page">
    <el-card class="search-card">
      <el-form :model="filters" inline size="default">
        <el-form-item label="字典名称">
          <el-input v-model="filters.name" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="标识">
          <el-input v-model="filters.code" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="请选择" clearable style="width:120px">
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
        <el-button type="primary" @click="handleAdd">新增字典</el-button>
      </div>
      <el-table :data="dictList" border stripe v-loading="status === 'pending'">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="name" label="字典名称" min-width="150" />
        <el-table-column prop="code" label="标识" width="160" />
        <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip />
        <el-table-column prop="dataCount" label="数据量" width="70" />
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
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button type="success" link size="small" @click="handleDictData(row as unknown as DictTypeItem)">数据</el-button>
            <el-button type="primary" link size="small" @click="handleEdit(row as unknown as DictTypeItem)">修改</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row as unknown as DictTypeItem)">删除</el-button>
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

    <!-- 新增/编辑字典类型 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑字典' : '新增字典'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="标识" prop="code">
          <el-input v-model="form.code" :disabled="isEdit" />
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

    <!-- 字典数据管理对话框 -->
    <el-dialog v-model="dataDialogVisible" title="字典数据" width="750px" :close-on-click-modal="false">
      <div v-if="currentDictId">
        <div style="margin-bottom:12px">
          <el-button type="primary" size="small" @click="handleDataAdd">新增数据</el-button>
        </div>
        <el-table :data="dictDataList" border stripe size="small" v-loading="dataLoading">
          <el-table-column prop="label" label="标签" width="120" />
          <el-table-column prop="value" label="键值" width="120" />
          <el-table-column prop="sort" label="排序" width="60" />
          <el-table-column label="状态" width="70">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
                {{ row.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" show-overflow-tooltip />
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="handleDataEdit(row as unknown as DictDataItem)">编辑</el-button>
              <el-button type="danger" link size="small" @click="handleDataDelete(row as unknown as DictDataItem)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <!-- 字典数据编辑 -->
    <el-dialog v-model="dataFormVisible" :title="isDataEdit ? '编辑数据' : '新增数据'" width="500px">
      <el-form ref="dataFormRef" :model="dataForm" :rules="dataRules" label-width="80px">
        <el-form-item label="标签" prop="label">
          <el-input v-model="dataForm.label" />
        </el-form-item>
        <el-form-item label="键值" prop="value">
          <el-input v-model="dataForm.value" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="dataForm.sort" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="dataForm.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="dataForm.remark" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dataFormVisible = false">取消</el-button>
        <el-button type="primary" :loading="dataSubmitLoading" @click="handleDataSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
import type { DictTypeItem, DictDataItem, ApiResponse, PaginatedData } from '#shared/types/api'

const dialogVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref()

// 字典数据
const dataDialogVisible = ref(false)
const dataLoading = ref(false)
const currentDictId = ref(0)
const dictDataList = ref<DictDataItem[]>([])
const dataFormVisible = ref(false)
const isDataEdit = ref(false)
const dataSubmitLoading = ref(false)
const dataFormRef = ref()

const page = ref(1)
const pageSize = ref(10)
const filters = reactive({
  name: '',
  code: '',
  status: undefined as number | undefined,
})

const { data, status, refresh } = useLazyFetch<ApiResponse<PaginatedData<DictTypeItem>>>('/api/system/dict-type', {
  query: computed(() => ({ page: page.value, pageSize: pageSize.value, ...filters })),
})
const dictList = computed(() => data.value?.data?.list ?? [])
const total = computed(() => data.value?.data?.total ?? 0)

const form = reactive({
  id: 0,
  name: '',
  code: '',
  status: 1,
  remark: '',
})

const rules = {
  name: [{ required: true, message: '请输入字典名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入字典标识', trigger: 'blur' }],
}

const dataForm = reactive({
  id: 0,
  dictTypeId: 0,
  label: '',
  value: '',
  sort: 0,
  status: 1,
  remark: '',
})

const dataRules = {
  label: [{ required: true, message: '请输入标签', trigger: 'blur' }],
  value: [{ required: true, message: '请输入键值', trigger: 'blur' }],
}

function handleSearch() { page.value = 1 }
function handleReset() { filters.name = ''; filters.code = ''; filters.status = undefined; page.value = 1 }

function handleAdd() {
  isEdit.value = false
  form.id = 0; form.name = ''; form.code = ''; form.status = 1; form.remark = ''
  dialogVisible.value = true
}

function handleEdit(row: DictTypeItem) {
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
      await $fetch(`/api/system/dict-type/${form.id}`, { method: 'PUT', body: { ...form } })
      ElMessage.success('更新成功')
    } else {
      await $fetch('/api/system/dict-type', { method: 'POST', body: { ...form } })
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

async function handleDelete(row: DictTypeItem) {
  await ElMessageBox.confirm(`确定删除字典"${row.name}"？`, '提示', { type: 'warning' })
  await $fetch(`/api/system/dict-type/${row.id}`, { method: 'DELETE' })
  ElMessage.success('删除成功')
  refresh()
}

// 字典数据管理
async function handleDictData(row: DictTypeItem) {
  currentDictId.value = row.id
  dataDialogVisible.value = true
  dataLoading.value = true
  try {
    const res = await $fetch('/api/system/dict-data', { params: { dictTypeId: row.id, pageSize: 100 } }) as unknown as ApiResponse<PaginatedData<DictDataItem>>
    dictDataList.value = res.data.list
  } finally {
    dataLoading.value = false
  }
}

function handleDataAdd() {
  isDataEdit.value = false
  dataForm.id = 0
  dataForm.dictTypeId = currentDictId.value
  dataForm.label = ''
  dataForm.value = ''
  dataForm.sort = 0
  dataForm.status = 1
  dataForm.remark = ''
  dataFormVisible.value = true
}

function handleDataEdit(row: DictDataItem) {
  isDataEdit.value = true
  Object.assign(dataForm, row)
  dataFormVisible.value = true
}

async function handleDataSubmit() {
  const valid = await dataFormRef.value.validate().catch(() => false)
  if (!valid) return
  dataSubmitLoading.value = true
  try {
    if (isDataEdit.value) {
      await $fetch(`/api/system/dict-data/${dataForm.id}`, { method: 'PUT', body: { ...dataForm } })
      ElMessage.success('更新成功')
    } else {
      await $fetch('/api/system/dict-data', { method: 'POST', body: { ...dataForm } })
      ElMessage.success('创建成功')
    }
    dataFormVisible.value = false
    // 刷新数据列表
    const res = await $fetch<ApiResponse<PaginatedData<DictDataItem>>>('/api/system/dict-data', { params: { dictTypeId: currentDictId.value, pageSize: 100 } })
    dictDataList.value = res.data.list
  } catch (err: any) {
    ElMessage.error(err.data?.message || '操作失败')
  } finally {
    dataSubmitLoading.value = false
  }
}

async function handleDataDelete(row: DictDataItem) {
  await ElMessageBox.confirm(`确定删除字典数据"${row.label}"？`, '提示', { type: 'warning' })
  await $fetch(`/api/system/dict-data/${row.id}`, { method: 'DELETE' })
  ElMessage.success('删除成功')
  const res = await $fetch<ApiResponse<PaginatedData<DictDataItem>>>('/api/system/dict-data', { params: { dictTypeId: currentDictId.value, pageSize: 100 } })
  dictDataList.value = res.data.list
}

function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleString('zh-CN')
}

// useLazyFetch auto-fetches on mount
</script>

<style scoped>
.dict-page { width: 100%; }
.search-card { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; }
.table-pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
