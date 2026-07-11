<template>
  <div class="eats-merchant-page">
    <el-card class="search-card">
      <el-form :model="filters" inline size="default">
        <el-form-item label="商家名称">
          <el-input v-model="filters.name" placeholder="请输入名称" clearable />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="filters.categoryId" placeholder="请选择" clearable style="width:140px">
            <el-option v-for="c in categoryOptions" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="请选择" clearable style="width:100px">
            <el-option label="营业" :value="1" />
            <el-option label="休业" :value="0" />
            <el-option label="暂停" :value="2" />
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
        <el-button type="primary" @click="handleAdd">新增商家</el-button>
      </div>
      <el-table :data="list" border stripe v-loading="loading">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="name" label="商家名称" min-width="160" />
        <el-table-column prop="categoryName" label="分类" width="100" />
        <el-table-column label="等级" width="80">
          <template #default="{ row }">
            <el-tag :type="row.level === 2 ? 'danger' : row.level === 1 ? 'warning' : 'info'" size="small">
              {{ ['普通', '精选', '品牌'][row.level] || '普通' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="评分" width="80">
          <template #default="{ row }">★ {{ row.rating ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="月销量" width="80" prop="monthlySales" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'warning' : 'danger'" size="small">
              {{ row.status === 1 ? '营业' : row.status === 2 ? '暂停' : '休业' }}
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑商家' : '新增商家'" width="820px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商家名称" prop="name">
              <el-input v-model="form.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="编码" prop="code">
              <el-input v-model="form.code" :disabled="isEdit" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="分类" prop="categoryId">
              <el-select v-model="form.categoryId" placeholder="请选择" style="width:100%">
                <el-option v-for="c in categoryOptions" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="等级">
              <el-select v-model="form.level" style="width:100%">
                <el-option :value="0" label="普通" />
                <el-option :value="1" label="精选" />
                <el-option :value="2" label="品牌" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="form.status" style="width:100%">
                <el-option :value="1" label="营业" />
                <el-option :value="0" label="休业" />
                <el-option :value="2" label="暂停" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属地区">
              <el-cascader
                v-model="regionCascade"
                :options="regionTree"
                :props="{ value: 'id', label: 'name', children: 'children', checkStrictly: true, emitPath: false }"
                placeholder="请选择城市"
                style="width:100%"
                clearable
                @change="(val: any) => form.regionId = val"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="配送费">
              <el-input-number v-model="form.deliveryFee" :min="0" :precision="1" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="起送价">
              <el-input-number v-model="form.minOrderAmount" :min="0" :precision="1" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="预计时间(分)">
              <el-input-number v-model="form.estimatedDeliveryTime" :min="0" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="营业时间">
              <el-time-picker v-model="form.openTime" format="HH:mm" value-format="HH:mm" placeholder="开业" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="打烊时间">
              <el-time-picker v-model="form.closeTime" format="HH:mm" value-format="HH:mm" placeholder="打烊" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="联系电话">
          <el-input v-model="form.contactPhone" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.address" />
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
import type { MerchantItem, ApiResponse, PaginatedData } from '#shared/types/api'

const dialogVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref()
const categoryOptions = ref<any[]>([])

const page = ref(1)
const pageSize = ref(10)
const filters = reactive({ name: '', categoryId: undefined as number | undefined, status: undefined as number | undefined })

const { data, status, refresh } = useLazyFetch<ApiResponse<PaginatedData<MerchantItem>>>('/api/admin/merchant', {
  query: computed(() => ({ page: page.value, pageSize: pageSize.value, ...filters })),
})
const loading = computed(() => status.value === 'pending')
const list = computed(() => data.value?.data?.list ?? [])
const total = computed(() => data.value?.data?.total ?? 0)

const regionTree = ref<any[]>([])
const regionCascade = ref<number>()

async function loadRegionTree() {
  const res: any = await $fetch('/api/admin/region', { params: { tree: true, status: 1 } })
  regionTree.value = res.data.list
}

const form = reactive({
  id: 0, name: '', code: '', description: '', categoryId: undefined as number | undefined,
  level: 0, status: 1, deliveryFee: 0, minOrderAmount: 0, estimatedDeliveryTime: 30,
  openTime: '', closeTime: '', contactPhone: '', address: '',
  regionId: undefined as number | undefined,
})

const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入编码', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
}

async function loadCategories() {
  const res: any = await $fetch('/api/admin/merchant-category/all')
  categoryOptions.value = res.data
}

function handleSearch() { page.value = 1 }
function handleReset() { filters.name = ''; filters.categoryId = undefined; filters.status = undefined; page.value = 1 }

function handleAdd() {
  isEdit.value = false
  form.id = 0; form.name = ''; form.code = ''; form.description = ''; form.categoryId = undefined
  form.level = 0; form.status = 1; form.deliveryFee = 0; form.minOrderAmount = 0; form.estimatedDeliveryTime = 30
  form.openTime = ''; form.closeTime = ''; form.contactPhone = ''; form.address = ''
  form.regionId = undefined
  regionCascade.value = undefined
  dialogVisible.value = true
}

function handleEdit(row: any) {
  isEdit.value = true
  Object.assign(form, {
    id: row.id, name: row.name, code: row.code, description: row.description || '',
    categoryId: row.categoryId, level: row.level ?? 0, status: row.status ?? 1,
    deliveryFee: row.deliveryFee ?? 0, minOrderAmount: row.minOrderAmount ?? 0,
    estimatedDeliveryTime: row.estimatedDeliveryTime ?? 30,
    openTime: row.openTime || '', closeTime: row.closeTime || '',
    contactPhone: row.contactPhone || '', address: row.address || '',
    regionId: row.regionId,
  })
  regionCascade.value = row.regionId
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    const body = { ...form, id: undefined }
    if (isEdit.value) {
      await $fetch(`/api/admin/merchant/${form.id}`, { method: 'PUT', body })
      ElMessage.success('更新成功')
    } else {
      await $fetch('/api/admin/merchant', { method: 'POST', body })
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
  await ElMessageBox.confirm(`确定删除商家"${row.name}"？`, '提示', { type: 'warning' })
  await $fetch(`/api/admin/merchant/${row.id}`, { method: 'DELETE' })
  ElMessage.success('删除成功')
  refresh()
}

onMounted(() => { loadCategories(); loadRegionTree() })
</script>

<style scoped>
.eats-merchant-page { width: 100%; }
.search-card { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; }
.table-pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
