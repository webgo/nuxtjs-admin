<template>
  <div class="eats-product-page">
    <el-card class="search-card">
      <el-form :model="filters" inline size="default">
        <el-form-item label="商家">
          <el-select v-model="filters.merchantId" placeholder="请选择商家" clearable style="width:200px" filterable remote :remote-method="searchMerchant" :loading="merchantLoading">
            <el-option v-for="m in merchantOptions" :key="m.id" :label="m.name" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品名称">
          <el-input v-model="filters.name" placeholder="请输入名称" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="请选择" clearable style="width:100px">
            <el-option label="上架" :value="1" />
            <el-option label="下架" :value="0" />
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
        <el-button type="primary" @click="handleAdd">新增商品</el-button>
      </div>
      <el-table :data="list" border stripe v-loading="loading">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="name" label="商品名称" min-width="160" />
        <el-table-column prop="merchantName" label="所属商家" min-width="130" />
        <el-table-column prop="categoryName" label="分类" width="100" />
        <el-table-column prop="priceRange" label="价格" width="120" />
        <el-table-column prop="sales" label="销量" width="70" />
        <el-table-column label="状态" width="70">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '上架' : '下架' }}
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑商品' : '新增商品'" width="700px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商品名称" prop="name">
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
        <el-form-item label="所属商家" prop="merchantId">
          <el-select v-model="form.merchantId" placeholder="请选择" style="width:100%" filterable remote :remote-method="searchMerchant" :loading="merchantLoading" :disabled="isEdit">
            <el-option v-for="m in merchantOptions" :key="m.id" :label="m.name" :value="m.id" />
          </el-select>
        </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商品分类">
              <el-select v-model="form.categoryId" placeholder="请选择" clearable style="width:100%" filterable remote :remote-method="searchProductCategory" :loading="productCategoryLoading">
                <el-option v-for="c in productCategoryOptions" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="单位">
              <el-input v-model="form.unit" placeholder="份/个/碗" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="排序">
              <el-input-number v-model="form.sort" :min="0" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="推荐">
              <el-switch v-model="form.isRecommended" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider>规格设置</el-divider>
        <div v-for="(spec, idx) in form.specs" :key="idx" class="spec-row">
          <el-row :gutter="10">
            <el-col :span="5">
              <el-input v-model="spec.name" placeholder="规格名称" size="default" />
            </el-col>
            <el-col :span="5">
              <el-input-number v-model="spec.price" :min="0" :precision="2" placeholder="价格" size="default" style="width:100%" />
            </el-col>
            <el-col :span="6">
              <el-select v-model="spec.unitId" placeholder="价格单位" clearable size="default" style="width:100%">
                <el-option v-for="u in priceUnitOptions" :key="u.id" :label="`${u.symbol} ${u.name}`" :value="u.id" />
              </el-select>
            </el-col>
            <el-col :span="4">
              <el-button type="danger" :icon="Delete" size="default" @click="removeSpec(idx)" circle />
            </el-col>
          </el-row>
        </div>
        <el-button type="primary" plain @click="addSpec">+ 添加规格</el-button>
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
import type { ProductItem, ApiResponse, PaginatedData, PriceUnitItem } from '#shared/types/api'
import { Delete } from '@element-plus/icons-vue'

const dialogVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref()
const merchantOptions = ref<any[]>([])
const merchantLoading = ref(false)
const productCategoryOptions = ref<any[]>([])
const productCategoryLoading = ref(false)
const priceUnitOptions = ref<PriceUnitItem[]>([])

const page = ref(1)
const pageSize = ref(10)
const filters = reactive({ merchantId: undefined as number | undefined, name: '', status: undefined as number | undefined })

const { data, status, refresh } = useLazyFetch<ApiResponse<PaginatedData<ProductItem>>>('/api/eats/product', {
  query: computed(() => ({ page: page.value, pageSize: pageSize.value, ...filters })),
})
const loading = computed(() => status.value === 'pending')
const list = computed(() => data.value?.data?.list ?? [])
const total = computed(() => data.value?.data?.total ?? 0)

const form = reactive({
  id: 0, name: '', code: '', description: '', merchantId: undefined as number | undefined,
  categoryId: undefined as number | undefined, unit: '', sort: 0, isRecommended: 0,
  specs: [] as { name: string; price: number; unitId?: number }[],
})

const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入编码', trigger: 'blur' }],
  merchantId: [{ required: true, message: '请选择商家', trigger: 'change' }],
}

function addSpec() { form.specs.push({ name: '', price: 0, unitId: undefined }) }
function removeSpec(idx: number) { form.specs.splice(idx, 1) }

async function loadMerchants(query?: string) {
  merchantLoading.value = true
  try {
    const res: any = await $fetch('/api/eats/merchant', { params: { page: 1, pageSize: 20, name: query || undefined } })
    merchantOptions.value = res.data.list
  } finally {
    merchantLoading.value = false
  }
}

function searchMerchant(query: string) {
  loadMerchants(query || undefined)
}

async function loadProductCategories(merchantId: number, query?: string) {
  if (!merchantId) { productCategoryOptions.value = []; return }
  productCategoryLoading.value = true
  try {
    const res: any = await $fetch('/api/eats/product-category', { params: { page: 1, pageSize: 20, merchantId, name: query || undefined } })
    productCategoryOptions.value = res.data.list
  } finally {
    productCategoryLoading.value = false
  }
}

function searchProductCategory(query: string) {
  if (form.merchantId) loadProductCategories(form.merchantId, query || undefined)
}

watch(() => form.merchantId, (v) => {
  form.categoryId = undefined
  if (v) loadProductCategories(v)
})

function handleSearch() { page.value = 1 }
function handleReset() { filters.merchantId = undefined; filters.name = ''; filters.status = undefined; page.value = 1 }

function handleAdd() {
  isEdit.value = false
  form.id = 0; form.name = ''; form.code = ''; form.description = ''; form.merchantId = undefined
  form.categoryId = undefined; form.unit = ''; form.sort = 0; form.isRecommended = 0
  form.specs = [{ name: '默认', price: 0, unitId: undefined }]
  dialogVisible.value = true
}

async function handleEdit(row: any) {
  isEdit.value = true
  const res: any = await $fetch(`/api/eats/product/${row.id}`)
  const p = res.data
  form.id = p.id; form.name = p.name; form.code = p.code; form.description = p.description || ''
  form.merchantId = p.merchantId; form.categoryId = p.categoryId; form.unit = p.unit || ''
  form.sort = p.sort; form.isRecommended = p.isRecommended
  form.specs = p.specs.map((s: any) => ({ name: s.name, price: s.price, unitId: s.unitId ?? undefined }))
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  if (!form.specs.length) { ElMessage.warning('至少需要一个规格'); return }
  submitLoading.value = true
  try {
    const body = { ...form, id: undefined }
    if (isEdit.value) {
      await $fetch(`/api/eats/product/${form.id}`, { method: 'PUT', body })
      ElMessage.success('更新成功')
    } else {
      await $fetch('/api/eats/product', { method: 'POST', body })
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
  await ElMessageBox.confirm(`确定删除商品"${row.name}"？`, '提示', { type: 'warning' })
  await $fetch(`/api/eats/product/${row.id}`, { method: 'DELETE' })
  ElMessage.success('删除成功')
  refresh()
}

async function loadPriceUnits() {
  try {
    const res: any = await $fetch('/api/system/price-unit/all')
    if (res.code === 200) priceUnitOptions.value = res.data ?? []
  } catch { /* silent */ }
}

onMounted(() => {
  loadMerchants()
  loadPriceUnits()
})
</script>

<style scoped>
.eats-product-page { width: 100%; }
.search-card { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; }
.table-pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
.spec-row { margin-bottom: 8px; }
</style>
