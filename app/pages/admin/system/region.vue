<template>
  <div class="region-page">
    <el-card class="search-card">
      <el-form :model="filters" inline size="default">
        <el-form-item label="名称">
          <el-input v-model="filters.name" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="层级">
          <el-select v-model="filters.level" placeholder="请选择" clearable style="width:120px">
            <el-option label="国家/地区" :value="1" />
            <el-option label="省份/州" :value="2" />
            <el-option label="城市" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="语言">
          <el-select v-model="filters.lang" placeholder="请选择" clearable style="width:100px">
            <el-option label="中文" value="tw" />
            <el-option label="English" value="en" />
            <el-option label="日本語" value="jp" />
          </el-select>
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
        <el-button type="primary" @click="handleAdd">新增地区</el-button>
      </div>
      <el-table
        :data="regionTree"
        border
        stripe
        v-loading="treeLoading"
        row-key="id"
        default-expand-all
        :tree-props="{ children: 'children' }"
      >
        <el-table-column prop="name" label="名称" min-width="180" />
        <el-table-column label="层级" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.level === 1" type="warning" size="small">国家/地区</el-tag>
            <el-tag v-else-if="row.level === 2" type="primary" size="small">省份/州</el-tag>
            <el-tag v-else size="small">城市</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="关联语言" width="120">
          <template #default="{ row }">
            <template v-if="row.lang">
              <el-tag v-for="l in row.lang.split(',')" :key="l" size="small" class="mr-1">
                {{ langMap[l] || l }}
              </el-tag>
            </template>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>
        <el-table-column label="经纬度" width="180">
          <template #default="{ row }">
            <template v-if="row.lng != null && row.lat != null">
              {{ row.lat }}, {{ row.lng }}
            </template>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="70">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
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
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑地区' : '新增地区'" width="650px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="上级地区" prop="parentId">
          <el-cascader
            v-model="parentPath"
            :options="parentOptions"
            :props="{ value: 'id', label: 'name', children: 'children', checkStrictly: true, emitPath: false }"
            placeholder="无（顶级）"
            clearable
            filterable
            style="width:100%"
            @change="handleParentChange"
          />
        </el-form-item>
        <el-form-item label="层级" prop="level">
          <el-select v-model="form.level" placeholder="请选择" style="width:100%">
            <el-option label="国家/地区" :value="1" />
            <el-option label="省份/州" :value="2" />
            <el-option label="城市" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联语言" prop="lang">
          <el-select v-model="langList" multiple placeholder="请选择" style="width:100%">
            <el-option label="中文 (tw)" value="tw" />
            <el-option label="English (en)" value="en" />
            <el-option label="日本語 (jp)" value="jp" />
          </el-select>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="经度" prop="lng">
              <el-input-number v-model="form.lng" :min="-180" :max="180" :precision="6" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="纬度" prop="lat">
              <el-input-number v-model="form.lat" :min="-90" :max="90" :precision="6" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="多语言名称">
          <div style="width:100%;display:flex;flex-direction:column;gap:8px">
            <el-input v-model="form.nameTw" placeholder="中文名称" />
            <el-input v-model="form.nameEn" placeholder="English name" />
            <el-input v-model="form.nameJp" placeholder="日本語名" />
          </div>
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

interface RegionItem {
  id: number
  name: string
  nameTw?: string
  nameEn?: string
  nameJp?: string
  parentId: number | null
  level: number
  lang?: string
  lng?: number | null
  lat?: number | null
  sort: number
  status: number
  remark?: string
  children?: RegionItem[]
}

const langMap: Record<string, string> = { tw: '中文', en: 'English', jp: '日本語' }

const treeLoading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref()

const regionTree = ref<RegionItem[]>([])

const filters = reactive({
  name: '',
  level: undefined as number | undefined,
  lang: '',
  status: undefined as number | undefined,
})

const form = reactive({
  id: 0,
  name: '',
  nameTw: '',
  nameEn: '',
  nameJp: '',
  parentId: null as number | null,
  level: 1,
  lang: '',
  lng: null as number | null,
  lat: null as number | null,
  sort: 0,
  status: 1,
  remark: '',
})

const langList = ref<string[]>([])
const parentPath = ref<number | null>(null)
const parentOptions = ref<RegionItem[]>([])

const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  level: [{ required: true, message: '请选择层级', trigger: 'change' }],
}

async function fetchTree() {
  treeLoading.value = true
  try {
    const query: Record<string, any> = {}
    if (filters.name) query.name = filters.name
    if (filters.level) query.level = filters.level
    if (filters.lang) query.lang = filters.lang
    if (filters.status != null) query.status = filters.status
    const res = await $fetch<{ code: number; data: { list: RegionItem[] } }>('/api/admin/region', { params: { tree: true, ...query } })
    regionTree.value = res.data.list ?? []
  } catch {
    regionTree.value = []
  } finally {
    treeLoading.value = false
  }
}

function buildParentOptions(tree: RegionItem[], excludeId?: number): RegionItem[] {
  return tree
    .filter(item => item.id !== excludeId)
    .map(item => ({
      ...item,
      children: item.children ? buildParentOptions(item.children, excludeId) : [],
    }))
}

function filterParentByLevel(tree: RegionItem[], targetLevel: number): RegionItem[] {
  return tree
    .filter(item => item.level < targetLevel)
    .map(item => ({
      ...item,
      children: item.children ? filterParentByLevel(item.children, targetLevel) : [],
    }))
}

function setParentOptions() {
  const raw = buildParentOptions(regionTree.value, isEdit.value ? form.id : undefined)
  parentOptions.value = form.level > 1 ? filterParentByLevel(raw, form.level) : []
}

function handleParentChange(val: any) {
  form.parentId = val
}

function handleSearch() { fetchTree() }
function handleReset() {
  filters.name = ''
  filters.level = undefined
  filters.lang = ''
  filters.status = undefined
  fetchTree()
}

function handleAdd() {
  isEdit.value = false
  form.id = 0
  form.name = ''
  form.nameTw = ''
  form.nameEn = ''
  form.nameJp = ''
  form.parentId = null
  form.level = 1
  form.lang = ''
  form.lng = null
  form.lat = null
  form.sort = 0
  form.status = 1
  form.remark = ''
  langList.value = []
  parentPath.value = null
  nextTick(() => setParentOptions())
  dialogVisible.value = true
}

function handleEdit(row: any) {
  isEdit.value = true
  form.id = row.id
  form.name = row.name
  form.nameTw = row.nameTw ?? ''
  form.nameEn = row.nameEn ?? ''
  form.nameJp = row.nameJp ?? ''
  form.parentId = row.parentId
  form.level = row.level
  form.lang = row.lang ?? ''
  form.lng = row.lng ?? null
  form.lat = row.lat ?? null
  form.sort = row.sort
  form.status = row.status
  form.remark = row.remark ?? ''
  langList.value = row.lang ? row.lang.split(',').filter(Boolean) : []
  parentPath.value = row.parentId
  nextTick(() => setParentOptions())
  dialogVisible.value = true
}

watch(() => form.level, () => {
  if (!isEdit.value) {
    form.parentId = null
    parentPath.value = null
  }
  nextTick(() => setParentOptions())
})

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    const body = { ...form, lang: langList.value.join(','), parentId: form.level === 1 ? null : form.parentId }
    if (isEdit.value) {
      await $fetch(`/api/admin/region/${form.id}`, { method: 'PUT', body })
      ElMessage.success('更新成功')
    } else {
      await $fetch('/api/admin/region', { method: 'POST', body })
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchTree()
  } catch (err: any) {
    ElMessage.error(err.data?.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm(`确定删除地区"${row.name}"？`, '提示', { type: 'warning' })
  await $fetch(`/api/admin/region/${row.id}`, { method: 'DELETE' })
  ElMessage.success('删除成功')
  fetchTree()
}

onMounted(() => fetchTree())
</script>

<style scoped>
.region-page { width: 100%; }
.search-card { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; }
.mr-1 { margin-right: 4px; }
</style>
