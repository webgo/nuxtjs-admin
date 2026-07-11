<template>
  <div class="article-page">
    <el-card class="search-card">
      <el-form :model="query" inline size="default">
        <el-form-item label="标题">
          <el-input v-model="query.title" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="query.categoryId" placeholder="请选择" clearable style="width:150px">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="推荐">
          <el-select v-model="query.isRecommended" placeholder="请选择" clearable style="width:100px">
            <el-option label="推荐" :value="1" />
            <el-option label="普通" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="请选择" clearable style="width:100px">
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
        <el-button type="primary" @click="handleAdd">新增内容</el-button>
      </div>
      <el-table :data="articleList" border stripe v-loading="loading">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column label="缩略图" width="120" align="center">
          <template #default="{ row }">
            <el-image
              v-if="row.thumbnail"
              :src="row.thumbnail"
              style="width:60px;height:40px"
              fit="cover"
              :preview-src-list="[row.thumbnail]"
              preview-teleported
            />
            <span v-else class="no-thumb">无</span>
          </template>
        </el-table-column>
        <el-table-column label="分类" width="120">
          <template #default="{ row }">{{ row.category?.name || '未分类' }}</template>
        </el-table-column>
        <el-table-column label="推荐" width="70" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isRecommended === 1 ? 'warning' : 'info'" size="small">
              {{ row.isRecommended === 1 ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="clickCount" label="点击量" width="70" align="center" />
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑内容' : '新增内容'" width="920px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" maxlength="200" show-word-limit />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="缩略图" class="thumbnail-item">
              <el-input v-model="form.thumbnail" placeholder="图片URL或点击上传" class="thumbnail-input" />
              <el-button @click="handleThumbnailUpload" :loading="thumbLoading" size="default" class="thumb-btn">
                上传
              </el-button>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类">
              <el-select v-model="form.categoryId" placeholder="请选择" clearable style="width:100%">
                <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="推荐">
              <el-switch v-model="form.isRecommended" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-radio-group v-model="form.status">
                <el-radio :value="1">启用</el-radio>
                <el-radio :value="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item v-if="form.thumbnail" label="预览">
          <el-image :src="form.thumbnail" style="max-width:120px;max-height:80px" fit="cover" :preview-src-list="[form.thumbnail]" preview-teleported />
        </el-form-item>
        <el-form-item label="摘要">
          <el-input v-model="form.summary" type="textarea" :rows="3" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="详情" class="editor-item">
          <RichTextEditor v-model="form.content" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
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
import type { ContentItem, CategoryItem, ApiResponse, PaginatedData } from '#shared/types/api'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const { uploadFile } = useFileHelper()

const articleList = ref<ContentItem[]>([])
const categories = ref<CategoryItem[]>([])
const total = ref(0)
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const thumbLoading = ref(false)
const formRef = ref()

const query = reactive({
  page: 1,
  pageSize: 10,
  title: '',
  categoryId: undefined as number | undefined,
  isRecommended: undefined as number | undefined,
  status: undefined as number | undefined,
})

const form = reactive({
  id: 0,
  title: '',
  thumbnail: '',
  summary: '',
  content: '',
  categoryId: undefined as number | undefined,
  isRecommended: 0,
  status: 1,
  remark: '',
})

const rules = {
  title: [{ required: true, message: '请输入内容标题', trigger: 'blur' }],
}

async function fetchCategories() {
  try {
    const res = await $fetch<ApiResponse<PaginatedData<CategoryItem>>>('/api/admin/category/all')
    categories.value = res.data.list
  } catch {
    // ignore
  }
}

async function fetchData() {
  loading.value = true
  try {
    const res = await $fetch<ApiResponse<PaginatedData<ContentItem>>>('/api/admin/content', { params: query })
    articleList.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

function handleSearch() { query.page = 1; fetchData() }
function handleReset() {
  query.title = ''
  query.categoryId = undefined
  query.isRecommended = undefined
  query.status = undefined
  query.page = 1
  fetchData()
}

async function handleThumbnailUpload() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    thumbLoading.value = true
    try {
      const record = await uploadFile(file, { module: 'content' })
      form.thumbnail = record.filePath
      ElMessage.success('缩略图上传成功')
    } catch (err: any) {
      ElMessage.error(err.data?.message || '上传失败')
    } finally {
      thumbLoading.value = false
    }
  }
  input.click()
}

function handleAdd() {
  isEdit.value = false
  form.id = 0
  form.title = ''
  form.thumbnail = ''
  form.summary = ''
  form.content = ''
  form.categoryId = undefined
  form.isRecommended = 0
  form.status = 1
  form.remark = ''
  dialogVisible.value = true
}

function handleEdit(row: any) {
  isEdit.value = true
  form.id = row.id
  form.title = row.title
  form.thumbnail = row.thumbnail || ''
  form.summary = row.summary || ''
  form.content = row.content || ''
  form.categoryId = row.categoryId || undefined
  form.isRecommended = row.isRecommended
  form.status = row.status
  form.remark = row.remark || ''
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    if (isEdit.value) {
      await $fetch(`/api/admin/content/${form.id}`, { method: 'PUT', body: { ...form } })
      ElMessage.success('更新成功')
    } else {
      await $fetch('/api/admin/content', { method: 'POST', body: { ...form } })
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
  await ElMessageBox.confirm(`确定删除内容"${row.title}"？`, '提示', { type: 'warning' })
  await $fetch(`/api/admin/content/${row.id}`, { method: 'DELETE' })
  ElMessage.success('删除成功')
  fetchData()
}

function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchCategories()
  fetchData()
})
</script>

<style scoped>
.article-page { width: 100%; }
.search-card { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; }
.table-pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
.no-thumb { color: #999; font-size: 12px; }
.thumbnail-input { width: calc(100% - 80px) !important; }
.thumb-btn { margin-left: 6px; flex-shrink: 0; }
.thumbnail-item :deep(.el-form-item__content) { display: flex; align-items: flex-start; }
.editor-item :deep(.el-form-item__content) { line-height: 0; }
</style>
