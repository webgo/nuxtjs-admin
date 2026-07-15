<template>
  <div class="translation-page">
    <el-card class="search-card">
      <el-form :model="filters" inline size="default">
        <el-form-item label="翻译Key">
          <el-input v-model="filters.keySearch" placeholder="支持 x.y.z 格式" clearable />
        </el-form-item>
        <el-form-item label="翻译内容">
          <el-input v-model="filters.keyword" placeholder="搜索翻译内容" clearable />
        </el-form-item>
        <el-form-item label="命名空间">
          <el-select v-model="filters.namespace" placeholder="全部" clearable filterable style="width:160px">
            <el-option v-for="ns in namespaces" :key="ns" :label="ns" :value="ns" />
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
        <el-button type="primary" @click="handleAdd">新增翻译</el-button>
        <el-button @click="handleImport" :loading="importLoading">载入语言配置文件</el-button>
        <el-button @click="handleExport" :loading="exportLoading">保存到语言配置文件</el-button>
      </div>
      <el-table :data="list" border stripe v-loading="status === 'pending'">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="fullKey" label="翻译Key" min-width="200" show-overflow-tooltip />
        <el-table-column
          v-for="lang in languages"
          :key="lang.code"
          :label="`${lang.name} (${lang.code})`"
          min-width="200"
        >
          <template #default="{ row }">
            <el-input
              :model-value="getEditingValue(row, lang.code)"
              size="small"
              @input="(val: string) => setEditingValue(row, lang.code, val)"
              @blur="handleSaveTranslation(row, lang.code, getEditingValue(row, lang.code))"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
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

    <el-dialog v-model="addDialogVisible" title="新增翻译" width="600px">
      <el-form :model="addForm" label-width="100px">
        <el-form-item label="命名空间">
          <el-select v-model="addForm.namespace" placeholder="选择或输入" filterable allow-create style="width:100%">
            <el-option v-for="ns in namespaces" :key="ns" :label="ns" :value="ns" />
          </el-select>
        </el-form-item>
        <el-form-item label="Key">
          <el-input v-model="addForm.key" placeholder="如: loginTitle" />
        </el-form-item>
        <el-form-item v-for="lang in languages" :key="lang.code" :label="lang.name">
          <el-input v-model="addForm.values[lang.code]" :placeholder="`${lang.name}翻译`" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="addSubmitLoading" @click="handleAddSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
import type { TranslationFlatItem, LanguageItem, ApiResponse, PaginatedData } from '#shared/types/api'

const page = ref(1)
const pageSize = ref(20)
const filters = reactive({
  keyword: '',
  keySearch: '',
  namespace: '' as string,
})

const languages = ref<LanguageItem[]>([])
const namespaces = ref<string[]>([])

const { data, status, refresh } = useLazyFetch<ApiResponse<PaginatedData<TranslationFlatItem>>>('/api/admin/translation', {
  query: computed(() => ({
    page: page.value,
    pageSize: pageSize.value,
    keyword: filters.keyword || undefined,
    keySearch: filters.keySearch || undefined,
    namespace: filters.namespace || undefined,
  })),
})
const list = computed(() => data.value?.data?.list ?? [])
const total = computed(() => data.value?.data?.total ?? 0)

const exportLoading = ref(false)
const importLoading = ref(false)
const addDialogVisible = ref(false)
const addSubmitLoading = ref(false)
const addForm = reactive({
  namespace: '',
  key: '',
  values: {} as Record<string, string>,
})

const editingValues = reactive<Record<string, string>>({})

function getEditingValue(row: TranslationFlatItem, locale: string): string {
  const cellKey = `${row.id}::${locale}`
  if (!(cellKey in editingValues)) {
    editingValues[cellKey] = row.values[locale] || ''
  }
  return editingValues[cellKey]
}

function setEditingValue(row: TranslationFlatItem, locale: string, val: string) {
  editingValues[`${row.id}::${locale}`] = val
}

async function fetchLanguages() {
  const res = await $fetch('/api/admin/language/all')
  languages.value = (res as any).data || []
}

async function fetchNamespaces() {
  const res = await $fetch('/api/admin/translation/namespaces')
  namespaces.value = (res as any).data || []
}

function handleSearch() { page.value = 1 }
function handleReset() {
  filters.keyword = ''
  filters.keySearch = ''
  filters.namespace = ''
  clearEditingValues()
  page.value = 1
}

function handleAdd() {
  addForm.namespace = filters.namespace || ''
  addForm.key = ''
  addForm.values = {}
  addDialogVisible.value = true
}

async function handleAddSubmit() {
  if (!addForm.namespace || !addForm.key) {
    ElMessage.warning('请填写命名空间和Key')
    return
  }
  addSubmitLoading.value = true
  try {
    const translations = Object.entries(addForm.values)
      .filter(([, v]) => v)
      .map(([locale, value]) => ({
        namespace: addForm.namespace,
        key: addForm.key,
        locale,
        value,
      }))
    await $fetch('/api/admin/translation/batch', { method: 'POST', body: { translations } })
    ElMessage.success('创建成功')
    addDialogVisible.value = false
    await fetchNamespaces()
    clearEditingValues()
    refresh()
  } catch (err: any) {
    ElMessage.error(err.data?.message || '操作失败')
  } finally {
    addSubmitLoading.value = false
  }
}

async function handleSaveTranslation(row: TranslationFlatItem, locale: string, value: string) {
  if ((row.values[locale] || '') === value) return
  try {
    await $fetch('/api/admin/translation/upsert', {
      method: 'POST',
      body: { namespace: row.namespace, key: row.key, locale, value },
    })
    row.values[locale] = value
    delete editingValues[`${row.id}::${locale}`]
  } catch (err: any) {
    ElMessage.error(err.data?.message || '保存失败')
  }
}

function clearEditingValues() {
  for (const key of Object.keys(editingValues)) {
    delete editingValues[key]
  }
}

async function handleDelete(row: TranslationFlatItem) {
  await ElMessageBox.confirm(`确定删除翻译Key"${row.fullKey}"？`, '提示', { type: 'warning' })
  await $fetch('/api/admin/translation/key', { method: 'DELETE', params: { namespace: row.namespace, key: row.key } })
  ElMessage.success('删除成功')
  clearEditingValues()
  refresh()
}

async function handleImport() {
  importLoading.value = true
  try {
    await $fetch('/api/admin/translation/import', { method: 'POST' })
    ElMessage.success('载入成功')
    await fetchNamespaces()
    clearEditingValues()
    refresh()
  } catch (err: any) {
    ElMessage.error(err.data?.message || '载入失败')
  } finally {
    importLoading.value = false
  }
}

async function handleExport() {
  exportLoading.value = true
  try {
    await $fetch('/api/admin/translation/export', { method: 'POST' })
    ElMessage.success('保存成功')
  } catch (err: any) {
    ElMessage.error(err.data?.message || '保存失败')
  } finally {
    exportLoading.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchLanguages(), fetchNamespaces()])
})
</script>

<style scoped>
.translation-page { width: 100%; }
.search-card { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; }
.table-pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
