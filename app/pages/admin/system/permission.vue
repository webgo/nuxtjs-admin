<template>
  <div class="perm-page">
    <el-card>
      <div class="table-toolbar">
        <el-button type="primary" @click="handleAdd(0)">新增目录</el-button>
      </div>
      <el-table
        :data="permList"
        border
        stripe
        v-loading="loading"
        row-key="id"
        default-expand-all
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column prop="name" label="名称" min-width="180" />
        <el-table-column prop="code" label="权限标识" width="180" />
        <el-table-column label="类型" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.type === 0" type="warning" size="small">目录</el-tag>
            <el-tag v-else-if="row.type === 1" type="primary" size="small">菜单</el-tag>
            <el-tag v-else size="small">按钮</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路由路径" width="150" />
        <el-table-column prop="icon" label="图标" width="80" />
        <el-table-column prop="sort" label="排序" width="60" />
        <el-table-column label="状态" width="70">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleAdd(row.id)">新增</el-button>
            <el-button type="warning" link size="small" @click="handleEdit(row as unknown as PermissionNode)">修改</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row as unknown as PermissionNode)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑菜单' : '新增菜单'" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="上级菜单">
          <el-tree-select
            v-model="form.parentId"
            :data="parentTree"
            :props="{ label: 'name', children: 'children' }" node-key="id"
            placeholder="顶级目录"
            clearable
            check-strictly
            style="width:100%"
          />
        </el-form-item>
        <el-form-item label="菜单名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="form.type">
            <el-radio :value="0">目录</el-radio>
            <el-radio :value="1">菜单</el-radio>
            <el-radio :value="2">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="权限标识">
          <el-input v-model="form.code" placeholder="如：system:user:list" />
        </el-form-item>
        <el-form-item label="路由路径" v-if="form.type !== 2">
          <el-input v-model="form.path" placeholder="如：/system/user" />
        </el-form-item>
        <el-form-item label="图标" v-if="form.type !== 2">
          <el-input v-model="form.icon" placeholder="如：User" />
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
        <el-form-item label="显示状态" v-if="form.type !== 2">
          <el-radio-group v-model="form.visible">
            <el-radio :value="1">显示</el-radio>
            <el-radio :value="0">隐藏</el-radio>
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
import type { PermissionNode, ApiResponse } from '#shared/types/api'

const permList = ref<PermissionNode[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref()
const parentTree = ref<PermissionNode[]>([])

const form = reactive({
  id: 0,
  name: '',
  code: '',
  type: 1,
  parentId: 0,
  path: '',
  icon: '',
  sort: 0,
  status: 1,
  visible: 1,
  remark: '',
})

const rules = {
  name: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
}

async function fetchData() {
  loading.value = true
  try {
    const res = await $fetch('/api/system/permission') as unknown as ApiResponse<PermissionNode[]>
    permList.value = res.data
  } finally {
    loading.value = false
  }
}

function buildParentTree(list: any[], excludeId?: number): any[] {
  return list
    .filter((item: any) => item.id !== excludeId && item.type !== 2)
    .map((item: any) => ({
      id: item.id,
      name: item.name,
      children: item.children ? buildParentTree(item.children, excludeId) : [],
    }))
}

function handleAdd(parentId: number) {
  isEdit.value = false
  form.id = 0
  form.name = ''
  form.code = ''
  form.type = 1
  form.parentId = parentId
  form.path = ''
  form.icon = ''
  form.sort = 0
  form.status = 1
  form.visible = 1
  form.remark = ''
  parentTree.value = buildParentTree(permList.value)
  dialogVisible.value = true
}

function handleEdit(row: PermissionNode) {
  isEdit.value = true
  Object.assign(form, row)
  parentTree.value = buildParentTree(permList.value, row.id)
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    if (isEdit.value) {
      await $fetch(`/api/system/permission/${form.id}`, { method: 'PUT', body: { ...form } })
      ElMessage.success('更新成功')
    } else {
      await $fetch('/api/system/permission', { method: 'POST', body: { ...form } })
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

async function handleDelete(row: PermissionNode) {
  await ElMessageBox.confirm(`确定删除菜单"${row.name}"？`, '提示', { type: 'warning' })
  await $fetch(`/api/system/permission/${row.id}`, { method: 'DELETE' })
  ElMessage.success('删除成功')
  fetchData()
}

onMounted(() => fetchData())
</script>

<style scoped>
.perm-page { width: 100%; }
.table-toolbar { margin-bottom: 16px; }
</style>
