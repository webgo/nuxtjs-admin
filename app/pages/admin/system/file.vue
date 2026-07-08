<template>
  <div class="file-page">
    <el-card class="search-card">
      <el-form :model="filters" inline size="default">
        <el-form-item label="文件名">
          <el-input v-model="filters.fileName" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="文件类型">
          <el-select v-model="filters.fileType" placeholder="请选择" clearable style="width:140px">
            <el-option label="图片" value="image" />
            <el-option label="文档" value="pdf" />
            <el-option label="压缩包" value="zip" />
            <el-option label="其他" value="other" />
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
        <el-button type="primary" @click="uploadVisible = true">上传文件</el-button>
      </div>
      <el-table :data="fileList" border stripe v-loading="status === 'pending'">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column label="预览" width="90" align="center">
          <template #default="{ row }">
            <el-image
              v-if="isImageFile(row)"
              :src="row.filePath"
              style="width:48px;height:48px"
              fit="cover"
              :preview-src-list="[row.filePath]"
              preview-teleported
            />
            <el-icon v-else size="28" color="#909399"><Document /></el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="fileName" label="文件名" min-width="220" show-overflow-tooltip />
        <el-table-column label="文件路径" min-width="280" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="path-cell">
              <span class="path-text">{{ row.filePath }}</span>
              <el-button link type="primary" size="small" @click="copyPath(row.filePath)">
                <el-icon><CopyDocument /></el-icon>
              </el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="大小" width="100">
          <template #default="{ row }">{{ formatFileSize(row.fileSize) }}</template>
        </el-table-column>
        <el-table-column prop="fileType" label="MIME 类型" width="150" show-overflow-tooltip />
        <el-table-column prop="module" label="归属模块" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.module" size="small">{{ row.module }}</el-tag>
            <span v-else class="no-module">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="上传时间" width="180">
          <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleDownload(row)">下载</el-button>
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

    <!-- 上传对话框 -->
    <el-dialog v-model="uploadVisible" title="上传文件" width="550px" :close-on-click-modal="false">
      <el-upload
        ref="uploadRef"
        drag
        multiple
        :auto-upload="false"
        :file-list="pendingFiles"
        :on-change="onFileChange"
        :on-remove="onFileRemove"
        list-type="text"
        accept="*/*"
      >
        <el-icon class="upload-icon" size="48"><UploadFilled /></el-icon>
        <div class="upload-text">拖拽文件到此处，或 <em>点击选择文件</em></div>
        <template #tip>
          <div class="upload-tip">支持任意格式文件，单文件大小建议不超过 50MB</div>
        </template>
      </el-upload>
      <div v-if="previewUrls.length" class="preview-list">
        <el-image
          v-for="(url, idx) in previewUrls"
          :key="idx"
          :src="url"
          style="width:60px;height:60px;margin-right:8px"
          fit="cover"
        />
      </div>
      <template #footer>
        <el-button @click="uploadVisible = false">取消</el-button>
        <el-button type="primary" :loading="uploadLoading" @click="handleUpload">确定上传</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { Document, UploadFilled, CopyDocument } from '@element-plus/icons-vue'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const { formatFileSize } = useFileUpload()

const uploadVisible = ref(false)
const uploadLoading = ref(false)
const uploadRef = ref()
const pendingFiles = ref<any[]>([])
const previewUrls = ref<string[]>([])

const page = ref(1)
const pageSize = ref(10)
const filters = reactive({
  fileName: '',
  fileType: '',
})

const { data, status, refresh } = useLazyFetch('/api/system/file', {
  query: computed(() => ({ page: page.value, pageSize: pageSize.value, ...filters })),
})
const fileList = computed(() => (data.value as any)?.data?.list ?? [])
const total = computed(() => (data.value as any)?.data?.total ?? 0)

function isImageFile(row: any) {
  return row.fileType && row.fileType.startsWith('image/')
}

function onFileChange(file: any) {
  pendingFiles.value.push(file)
  if (file.raw && file.raw.type.startsWith('image/')) {
    previewUrls.value.push(URL.createObjectURL(file.raw))
  }
}

function onFileRemove(_file: any, fileList_: any[]) {
  pendingFiles.value = fileList_
  previewUrls.value = []
}

function handleSearch() { page.value = 1 }
function handleReset() { filters.fileName = ''; filters.fileType = ''; page.value = 1 }

async function handleUpload() {
  if (pendingFiles.value.length === 0) {
    ElMessage.warning('请先选择文件')
    return
  }
  uploadLoading.value = true
  try {
    const formData = new FormData()
    for (const f of pendingFiles.value) {
      formData.append('files', f.raw)
    }
    await $fetch('/api/system/file/upload', { method: 'POST', body: formData })
    ElMessage.success(`成功上传 ${pendingFiles.value.length} 个文件`)
    uploadVisible.value = false
    pendingFiles.value = []
    previewUrls.value = []
    refresh()
  } catch (err: any) {
    ElMessage.error(err.data?.message || '上传失败')
  } finally {
    uploadLoading.value = false
  }
}

function handleDownload(row: any) {
  window.open(row.filePath, '_blank')
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm(`确定删除文件"${row.fileName}"？`, '提示', { type: 'warning' })
  await $fetch(`/api/system/file/${row.id}`, { method: 'DELETE' })
  ElMessage.success('删除成功')
  refresh()
}

function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleString('zh-CN')
}

async function copyPath(path: string) {
  try {
    await navigator.clipboard.writeText(path)
    ElMessage.success('已复制文件路径')
  } catch {
    ElMessage.error('复制失败')
  }
}

// useLazyFetch auto-fetches on mount
</script>

<style scoped>
.file-page { width: 100%; }
.search-card { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; }
.table-pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
.no-module { color: #999; }
.path-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}
.path-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: #606266;
}
.upload-icon { margin-bottom: 8px; }
.upload-text { color: #606266; font-size: 14px; }
.upload-tip { color: #909399; font-size: 12px; margin-top: 6px; }
.preview-list { margin-top: 12px; display: flex; flex-wrap: wrap; }
</style>
