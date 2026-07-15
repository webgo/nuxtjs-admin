# Language Management Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete language management system for the admin backend — CRUD for languages, full translation content editing, and system default language setting.

**Architecture:** Two new DB tables (`sys_language` + `sys_translation`) with admin UI following existing CRUD patterns. Translation content is managed in DB and exported to JSON files for portal consumption, maintaining the current `@nuxtjs/i18n` architecture.

**Tech Stack:** Prisma 7 + MySQL, Element Plus, @nuxtjs/i18n, Redis (optional caching)

---

## Scope

| In Scope | Out of Scope |
|----------|-------------|
| Language CRUD (name, code, status, sort) | Admin backend i18n (Element Plus handles its own) |
| Translation CRUD (namespace, key, locale, value) | Runtime translation loading (use export-to-JSON) |
| Translation management UI (namespace tabs, key-value grid) | Auto-translation / machine translation |
| System default language setting | Locale cookie persistence for portal users |
| Export translations to JSON files | Portal language switcher component extraction |
| Menu/permission seed entries | |

## Design Decisions

1. **DB + Export approach**: Translations stored in DB for management, exported to JSON files for portal. This maintains the current `@nuxtjs/i18n` file-loading architecture while enabling full admin control.

2. **Namespace-based organization**: Translation keys use dot notation (`nav.login`). The UI groups keys by the first segment (namespace) for organized browsing.

3. **Default language**: A boolean `isDefault` field on `sys_language`. Only one language can be default at a time.

4. **Export workflow**: Admin edits translations → clicks "Export to JSON" → server writes `i18n/locales/{code}.json` → portal picks up changes on next page load (or rebuild in production).

---

## Task 1: Database Schema

**Files:**
- Create: `prisma/schema.prisma` (add 2 models)

### Step 1: Add SysLanguage model

Add to `prisma/schema.prisma` after the existing models:

```prisma
// ========== 语言管理 ==========
model SysLanguage {
  id         Int       @id @default(autoincrement())
  name       String    @db.VarChar(50)
  code       String    @unique @db.VarChar(20)
  isDefault  Boolean   @default(false) @map("is_default")
  sort       Int       @default(0)
  status     Int       @default(1)
  remark     String?   @db.VarChar(500)
  createTime DateTime  @default(now()) @map("create_time")
  updateTime DateTime  @updatedAt @map("update_time")

  translations SysTranslation[]

  @@map("sys_language")
}

model SysTranslation {
  id        Int      @id @default(autoincrement())
  namespace String   @db.VarChar(50)
  key       String   @db.VarChar(100)
  locale    String   @db.VarChar(10)
  value     String   @db.VarChar(2000)
  createTime DateTime @default(now()) @map("create_time")
  updateTime DateTime @updatedAt @map("update_time")

  @@unique([namespace, key, locale])
  @@index([locale])
  @@index([namespace])
  @@map("sys_translation")
}
```

### Step 2: Run migration and generate

```bash
npx prisma migrate dev --name add_language
npx prisma generate
```

### Step 3: Verify

```bash
npx prisma studio  # Check tables exist
```

---

## Task 2: Shared Types

**Files:**
- Modify: `shared/types/api.ts` (append)

### Step 1: Add types

Append to `shared/types/api.ts`:

```typescript
// ========== 语言模块 ==========
export interface LanguageItem {
  id: number
  name: string
  code: string
  isDefault: boolean
  sort: number
  status: number
  remark?: string
  createTime: string
}

export interface TranslationItem {
  id: number
  namespace: string
  key: string
  locale: string
  value: string
  createTime: string
}

export interface TranslationGroup {
  namespace: string
  keys: {
    key: string
    values: Record<string, string>  // locale -> value
  }[]
}
```

### Step 2: Verify

```bash
npx nuxi typecheck
```

---

## Task 3: Language Service

**Files:**
- Create: `server/services/language.service.ts`

### Step 1: Create service

Follow `price-unit.service.ts` pattern exactly:

```typescript
import prisma from '../utils/prisma'

export const languageService = {
  async list(params: { page: number; pageSize: number; name?: string; status?: number }) {
    const { page, pageSize, name, status } = params
    const where: Record<string, unknown> = {}
    if (name) where.name = { contains: name }
    if (status !== undefined) where.status = status

    const [rows, total] = await Promise.all([
      prisma.sysLanguage.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ sort: 'asc' }],
      }),
      prisma.sysLanguage.count({ where }),
    ])
    return { list: rows, total, page, pageSize }
  },

  async listAll() {
    return prisma.sysLanguage.findMany({
      where: { status: 1 },
      orderBy: [{ sort: 'asc' }],
    })
  },

  async findById(id: number) {
    const item = await prisma.sysLanguage.findUnique({ where: { id } })
    if (!item) throw createError({ statusCode: 404, message: '语言不存在' })
    return item
  },

  async findByCode(code: string) {
    return prisma.sysLanguage.findUnique({ where: { code } })
  },

  async create(params: { name: string; code: string; sort?: number; status?: number; remark?: string; isDefault?: boolean }) {
    // Check unique code
    const existing = await prisma.sysLanguage.findUnique({ where: { code: params.code } })
    if (existing) throw createError({ statusCode: 400, message: '语言编码已存在' })

    // If setting as default, unset others
    if (params.isDefault) {
      await prisma.sysLanguage.updateMany({ where: { isDefault: true }, data: { isDefault: false } })
    }

    return prisma.sysLanguage.create({ data: params })
  },

  async update(id: number, params: { name?: string; code?: string; sort?: number; status?: number; remark?: string; isDefault?: boolean }) {
    const item = await prisma.sysLanguage.findUnique({ where: { id } })
    if (!item) throw createError({ statusCode: 404, message: '语言不存在' })

    // Check unique code if changed
    if (params.code && params.code !== item.code) {
      const existing = await prisma.sysLanguage.findUnique({ where: { code: params.code } })
      if (existing) throw createError({ statusCode: 400, message: '语言编码已存在' })
    }

    // If setting as default, unset others
    if (params.isDefault) {
      await prisma.sysLanguage.updateMany({ where: { isDefault: true, id: { not: id } }, data: { isDefault: false } })
    }

    await prisma.sysLanguage.update({ where: { id }, data: params })
    return this.findById(id)
  },

  async delete(id: number) {
    const item = await prisma.sysLanguage.findUnique({ where: { id } })
    if (!item) throw createError({ statusCode: 404, message: '语言不存在' })

    // Delete associated translations
    await prisma.sysTranslation.deleteMany({ where: { locale: item.code } })
    await prisma.sysLanguage.delete({ where: { id } })
    return true
  },

  async getDefault() {
    return prisma.sysLanguage.findFirst({ where: { isDefault: true, status: 1 } })
  },
}
```

---

## Task 4: Translation Service

**Files:**
- Create: `server/services/translation.service.ts`

### Step 1: Create service

```typescript
import prisma from '../utils/prisma'

export const translationService = {
  // Get all translations grouped by namespace for a given locale (or all locales)
  async listByLocale(locale?: string) {
    const where: Record<string, unknown> = {}
    if (locale) where.locale = locale

    const rows = await prisma.sysTranslation.findMany({
      where,
      orderBy: [{ namespace: 'asc' }, { key: 'asc' }, { locale: 'asc' }],
    })

    // Group by namespace
    const grouped: Record<string, Record<string, Record<string, string>>> = {}
    for (const row of rows) {
      if (!grouped[row.namespace]) grouped[row.namespace] = {}
      if (!grouped[row.namespace][row.key]) grouped[row.namespace][row.key] = {}
      grouped[row.namespace][row.key][row.locale] = row.value
    }

    return grouped
  },

  // Get namespaces list
  async getNamespaces() {
    const result = await prisma.sysTranslation.findMany({
      select: { namespace: true },
      distinct: ['namespace'],
      orderBy: [{ namespace: 'asc' }],
    })
    return result.map(r => r.namespace)
  },

  // Upsert a single translation
  async upsert(params: { namespace: string; key: string; locale: string; value: string }) {
    return prisma.sysTranslation.upsert({
      where: {
        namespace_key_locale: {
          namespace: params.namespace,
          key: params.key,
          locale: params.locale,
        },
      },
      update: { value: params.value },
      create: params,
    })
  },

  // Batch upsert translations
  async batchUpsert(translations: { namespace: string; key: string; locale: string; value: string }[]) {
    const results = []
    for (const t of translations) {
      const result = await prisma.sysTranslation.upsert({
        where: {
          namespace_key_locale: {
            namespace: t.namespace,
            key: t.key,
            locale: t.locale,
          },
        },
        update: { value: t.value },
        create: t,
      })
      results.push(result)
    }
    return results
  },

  // Delete a translation key (all locales)
  async deleteKey(namespace: string, key: string) {
    await prisma.sysTranslation.deleteMany({ where: { namespace, key } })
    return true
  },

  // Delete a single translation entry
  async deleteEntry(id: number) {
    await prisma.sysTranslation.delete({ where: { id } })
    return true
  },

  // Export translations to JSON files
  async exportToJson() {
    const languages = await prisma.sysLanguage.findMany({ where: { status: 1 } })
    const allTranslations = await prisma.sysTranslation.findMany()

    const results: { code: string; file: string; keys: number }[] = []

    for (const lang of languages) {
      const localeTranslations = allTranslations.filter(t => t.locale === lang.code)
      const json: Record<string, string> = {}
      for (const t of localeTranslations) {
        json[`${t.namespace}.${t.key}`] = t.value
      }

      // Write to file
      const filePath = `i18n/locales/${lang.code}.json`
      const content = JSON.stringify(json, null, 2)

      // Use fs to write (available in Nitro)
      const fs = await import('fs')
      const path = await import('path')
      const fullPath = path.resolve(process.cwd(), filePath)
      fs.writeFileSync(fullPath, content, 'utf-8')

      results.push({ code: lang.code, file: filePath, keys: Object.keys(json).length })
    }

    return results
  },

  // Import from existing JSON files
  async importFromJson() {
    const fs = await import('fs')
    const path = await import('path')

    const languages = await prisma.sysLanguage.findMany()
    const results: { code: string; keys: number }[] = []

    for (const lang of languages) {
      const filePath = path.resolve(process.cwd(), `i18n/locales/${lang.code}.json`)
      if (!fs.existsSync(filePath)) continue

      const content = fs.readFileSync(filePath, 'utf-8')
      const json = JSON.parse(content)

      const translations: { namespace: string; key: string; locale: string; value: string }[] = []
      for (const [dotKey, value] of Object.entries(json)) {
        const lastDot = dotKey.lastIndexOf('.')
        const namespace = lastDot > 0 ? dotKey.substring(0, lastDot) : 'general'
        const key = lastDot > 0 ? dotKey.substring(lastDot + 1) : dotKey
        translations.push({ namespace, key, locale: lang.code, value: String(value) })
      }

      await this.batchUpsert(translations)
      results.push({ code: lang.code, keys: translations.length })
    }

    return results
  },
}
```

---

## Task 5: Language API Handlers

**Files:**
- Create: `server/api/admin/language/index.get.ts`
- Create: `server/api/admin/language/index.post.ts`
- Create: `server/api/admin/language/[id].put.ts`
- Create: `server/api/admin/language/[id].delete.ts`
- Create: `server/api/admin/language/all.get.ts`
- Create: `server/api/admin/language/default.get.ts`

### Step 1: Create directory

```bash
mkdir -p server/api/admin/language
```

### Step 2: Create GET list handler

`server/api/admin/language/index.get.ts`:

```typescript
import { languageService } from '../../../services/language.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const params: any = { page: Number(query.page) || 1, pageSize: Number(query.pageSize) || 10 }
  if (query.name) params.name = query.name
  if (query.status !== undefined) params.status = Number(query.status)
  return { code: 200, data: await languageService.list(params) }
})
```

### Step 3: Create POST create handler

`server/api/admin/language/index.post.ts`:

```typescript
import { languageService } from '../../../services/language.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return { code: 200, data: await languageService.create(body) }
})
```

### Step 4: Create PUT update handler

`server/api/admin/language/[id].put.ts`:

```typescript
import { languageService } from '../../../services/language.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  return { code: 200, data: await languageService.update(id, body) }
})
```

### Step 5: Create DELETE handler

`server/api/admin/language/[id].delete.ts`:

```typescript
import { languageService } from '../../../services/language.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  await languageService.delete(id)
  return { code: 200, msg: '删除成功' }
})
```

### Step 6: Create GET all handler (unpaginated)

`server/api/admin/language/all.get.ts`:

```typescript
import { languageService } from '../../../services/language.service'

export default defineEventHandler(async () => {
  return { code: 200, data: await languageService.listAll() }
})
```

### Step 7: Create GET default handler

`server/api/admin/language/default.get.ts`:

```typescript
import { languageService } from '../../../services/language.service'

export default defineEventHandler(async () => {
  const lang = await languageService.getDefault()
  return { code: 200, data: lang }
})
```

---

## Task 6: Translation API Handlers

**Files:**
- Create: `server/api/admin/translation/index.get.ts`
- Create: `server/api/admin/translation/upsert.post.ts`
- Create: `server/api/admin/translation/batch.post.ts`
- Create: `server/api/admin/translation/key.delete.ts`
- Create: `server/api/admin/translation/namespaces.get.ts`
- Create: `server/api/admin/translation/export.post.ts`
- Create: `server/api/admin/translation/import.post.ts`

### Step 1: Create directory

```bash
mkdir -p server/api/admin/translation
```

### Step 2: Create GET list handler

`server/api/admin/translation/index.get.ts`:

```typescript
import { translationService } from '../../../services/translation.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const locale = query.locale as string | undefined
  return { code: 200, data: await translationService.listByLocale(locale) }
})
```

### Step 3: Create POST upsert handler

`server/api/admin/translation/upsert.post.ts`:

```typescript
import { translationService } from '../../../services/translation.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return { code: 200, data: await translationService.upsert(body) }
})
```

### Step 4: Create POST batch upsert handler

`server/api/admin/translation/batch.post.ts`:

```typescript
import { translationService } from '../../../services/translation.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const translations = body.translations as { namespace: string; key: string; locale: string; value: string }[]
  return { code: 200, data: await translationService.batchUpsert(translations) }
})
```

### Step 5: Create DELETE key handler

`server/api/admin/translation/key.delete.ts`:

```typescript
import { translationService } from '../../../services/translation.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const namespace = query.namespace as string
  const key = query.key as string
  if (!namespace || !key) throw createError({ statusCode: 400, message: '缺少参数' })
  await translationService.deleteKey(namespace, key)
  return { code: 200, msg: '删除成功' }
})
```

### Step 6: Create GET namespaces handler

`server/api/admin/translation/namespaces.get.ts`:

```typescript
import { translationService } from '../../../services/translation.service'

export default defineEventHandler(async () => {
  return { code: 200, data: await translationService.getNamespaces() }
})
```

### Step 7: Create POST export handler

`server/api/admin/translation/export.post.ts`:

```typescript
import { translationService } from '../../../services/translation.service'

export default defineEventHandler(async () => {
  const results = await translationService.exportToJson()
  return { code: 200, data: results, msg: '导出成功' }
})
```

### Step 8: Create POST import handler

`server/api/admin/translation/import.post.ts`:

```typescript
import { translationService } from '../../../services/translation.service'

export default defineEventHandler(async () => {
  const results = await translationService.importFromJson()
  return { code: 200, data: results, msg: '导入成功' }
})
```

---

## Task 7: Language Management Page

**Files:**
- Create: `app/pages/admin/system/language.vue`

### Step 1: Create page

Follow `price-unit.vue` pattern. This is a standard CRUD page with search, table, and dialog.

```vue
<template>
  <div class="language-page">
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
        <el-button type="primary" @click="handleAdd">新增语言</el-button>
      </div>
      <el-table :data="list" border stripe v-loading="loading">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="name" label="名称" min-width="120" />
        <el-table-column prop="code" label="编码" width="120" />
        <el-table-column label="默认语言" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.isDefault" type="success" size="small">默认</el-tag>
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑语言' : '新增语言'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="如：中文、English" />
        </el-form-item>
        <el-form-item label="编码" prop="code">
          <el-input v-model="form.code" placeholder="如：zh-CN、en" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="默认语言">
          <el-switch v-model="form.isDefault" />
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

const { data, status, refresh } = useLazyFetch('/api/admin/language', {
  query: computed(() => ({ page: page.value, pageSize: pageSize.value, ...filters })),
})
const loading = computed(() => status.value === 'pending')
const list = computed(() => (data.value as any)?.data?.list ?? [])
const total = computed(() => (data.value as any)?.data?.total ?? 0)

const form = reactive({
  id: 0,
  name: '',
  code: '',
  isDefault: false,
  sort: 0,
  status: 1,
  remark: '',
})

const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入编码', trigger: 'blur' }],
}

function handleSearch() { page.value = 1 }
function handleReset() { filters.name = ''; filters.status = undefined; page.value = 1 }

function handleAdd() {
  isEdit.value = false
  Object.assign(form, { id: 0, name: '', code: '', isDefault: false, sort: 0, status: 1, remark: '' })
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
      await $fetch(`/api/admin/language/${form.id}`, { method: 'PUT', body: { ...form } })
      ElMessage.success('更新成功')
    } else {
      await $fetch('/api/admin/language', { method: 'POST', body: { ...form } })
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
  await ElMessageBox.confirm(`确定删除语言"${row.name}"？`, '提示', { type: 'warning' })
  await $fetch(`/api/admin/language/${row.id}`, { method: 'DELETE' })
  ElMessage.success('删除成功')
  refresh()
}

function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleString('zh-CN')
}
</script>

<style scoped>
.language-page { width: 100%; }
.search-card { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; }
.table-pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
```

---

## Task 8: Translation Management Page

**Files:**
- Create: `app/pages/admin/system/translation.vue`

### Step 1: Create page

This is the complex page with namespace tabs and key-value grid.

```vue
<template>
  <div class="translation-page">
    <!-- Toolbar -->
    <el-card class="toolbar-card">
      <div class="table-toolbar">
        <el-button type="primary" @click="handleAddKey">新增翻译</el-button>
        <el-button @click="handleImport" :loading="importLoading">从JSON导入</el-button>
        <el-button @click="handleExport" :loading="exportLoading">导出到JSON</el-button>
        <el-button type="warning" @click="handleSyncAll" :loading="syncLoading">同步全部语言</el-button>
      </div>
      <div class="filter-bar">
        <el-select v-model="selectedLocale" placeholder="选择语言" clearable style="width:150px">
          <el-option v-for="lang in languages" :key="lang.code" :label="`${lang.name} (${lang.code})`" :value="lang.code" />
        </el-select>
      </div>
    </el-card>

    <!-- Namespace Tabs -->
    <el-card class="content-card">
      <el-tabs v-model="activeNamespace" type="border-card">
        <el-tab-pane
          v-for="ns in namespaces"
          :key="ns"
          :label="ns"
          :name="ns"
        >
          <div class="translation-toolbar">
            <el-button type="primary" size="small" @click="handleAddKeyToNs(ns)">新增Key</el-button>
          </div>
          <el-table :data="getKeysForNamespace(ns)" border stripe size="small">
            <el-table-column prop="key" label="Key" min-width="200" />
            <el-table-column
              v-for="lang in languages"
              :key="lang.code"
              :label="`${lang.name} (${lang.code})`"
              min-width="250"
            >
              <template #default="{ row }">
                <el-input
                  v-model="row.values[lang.code]"
                  size="small"
                  @blur="handleSaveTranslation(ns, row.key, lang.code, row.values[lang.code] || '')"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ row }">
                <el-button type="danger" link size="small" @click="handleDeleteKey(ns, row.key)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- Add Key Dialog -->
    <el-dialog v-model="addKeyVisible" title="新增翻译Key" width="500px">
      <el-form :model="newKeyForm" label-width="80px">
        <el-form-item label="命名空间">
          <el-select v-model="newKeyForm.namespace" placeholder="选择命名空间" filterable allow-create>
            <el-option v-for="ns in namespaces" :key="ns" :label="ns" :value="ns" />
          </el-select>
        </el-form-item>
        <el-form-item label="Key">
          <el-input v-model="newKeyForm.key" placeholder="如：loginTitle" />
        </el-form-item>
        <el-form-item
          v-for="lang in languages"
          :key="lang.code"
          :label="lang.name"
        >
          <el-input v-model="newKeyForm.values[lang.code]" :placeholder="`${lang.name}翻译`" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addKeyVisible = false">取消</el-button>
        <el-button type="primary" :loading="addKeyLoading" @click="handleAddKeySubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

interface Language {
  id: number
  name: string
  code: string
  isDefault: boolean
  status: number
}

interface TranslationRow {
  key: string
  values: Record<string, string>
}

const languages = ref<Language[]>([])
const namespaces = ref<string[]>([])
const activeNamespace = ref('')
const selectedLocale = ref('')
const translationData = ref<Record<string, Record<string, Record<string, string>>>>({})

const exportLoading = ref(false)
const importLoading = ref(false)
const syncLoading = ref(false)
const addKeyVisible = ref(false)
const addKeyLoading = ref(false)

const newKeyForm = reactive({
  namespace: '',
  key: '',
  values: {} as Record<string, string>,
})

// Fetch languages
async function fetchLanguages() {
  const res = await $fetch('/api/admin/language/all')
  languages.value = (res as any).data || []
}

// Fetch namespaces
async function fetchNamespaces() {
  const res = await $fetch('/api/admin/translation/namespaces')
  namespaces.value = (res as any).data || []
}

// Fetch translations
async function fetchTranslations() {
  const params: any = {}
  if (selectedLocale.value) params.locale = selectedLocale.value
  const res = await $fetch('/api/admin/translation', { params })
  translationData.value = (res as any).data || {}
  if (namespaces.value.length && !activeNamespace.value) {
    activeNamespace.value = namespaces.value[0]
  }
}

function getKeysForNamespace(ns: string): TranslationRow[] {
  const keys = translationData.value[ns] || {}
  return Object.entries(keys).map(([key, values]) => ({ key, values }))
}

function handleAddKey() {
  newKeyForm.namespace = activeNamespace.value || ''
  newKeyForm.key = ''
  newKeyForm.values = {}
  addKeyVisible.value = true
}

function handleAddKeyToNs(ns: string) {
  newKeyForm.namespace = ns
  newKeyForm.key = ''
  newKeyForm.values = {}
  addKeyVisible.value = true
}

async function handleAddKeySubmit() {
  if (!newKeyForm.namespace || !newKeyForm.key) {
    ElMessage.warning('请填写命名空间和Key')
    return
  }
  addKeyLoading.value = true
  try {
    const translations = Object.entries(newKeyForm.values)
      .filter(([, value]) => value)
      .map(([locale, value]) => ({
        namespace: newKeyForm.namespace,
        key: newKeyForm.key,
        locale,
        value,
      }))
    await $fetch('/api/admin/translation/batch', { method: 'POST', body: { translations } })
    ElMessage.success('创建成功')
    addKeyVisible.value = false
    await fetchNamespaces()
    await fetchTranslations()
  } catch (err: any) {
    ElMessage.error(err.data?.message || '操作失败')
  } finally {
    addKeyLoading.value = false
  }
}

async function handleSaveTranslation(namespace: string, key: string, locale: string, value: string) {
  try {
    await $fetch('/api/admin/translation/upsert', {
      method: 'POST',
      body: { namespace, key, locale, value },
    })
  } catch (err: any) {
    ElMessage.error(err.data?.message || '保存失败')
  }
}

async function handleDeleteKey(namespace: string, key: string) {
  await ElMessageBox.confirm(`确定删除翻译Key"${namespace}.${key}"？`, '提示', { type: 'warning' })
  await $fetch('/api/admin/translation/key', { method: 'DELETE', params: { namespace, key } })
  ElMessage.success('删除成功')
  await fetchTranslations()
}

async function handleExport() {
  exportLoading.value = true
  try {
    const res = await $fetch('/api/admin/translation/export', { method: 'POST' })
    ElMessage.success(`导出成功：${(res as any).data?.map((r: any) => `${r.file}(${r.keys}条)`).join(', ')}`)
  } catch (err: any) {
    ElMessage.error(err.data?.message || '导出失败')
  } finally {
    exportLoading.value = false
  }
}

async function handleImport() {
  importLoading.value = true
  try {
    const res = await $fetch('/api/admin/translation/import', { method: 'POST' })
    ElMessage.success(`导入成功：${(res as any).data?.map((r: any) => `${r.code}(${r.keys}条)`).join(', ')}`)
    await fetchNamespaces()
    await fetchTranslations()
  } catch (err: any) {
    ElMessage.error(err.data?.message || '导入失败')
  } finally {
    importLoading.value = false
  }
}

async function handleSyncAll() {
  syncLoading.value = true
  try {
    // Get all languages, then batch upsert all keys for all locales
    const allTranslations: any[] = []
    for (const [ns, keys] of Object.entries(translationData.value)) {
      for (const [key, values] of Object.entries(keys)) {
        for (const [locale, value] of Object.entries(values)) {
          allTranslations.push({ namespace: ns, key, locale, value })
        }
      }
    }
    await $fetch('/api/admin/translation/batch', { method: 'POST', body: { translations: allTranslations } })
    ElMessage.success('同步完成')
  } catch (err: any) {
    ElMessage.error(err.data?.message || '同步失败')
  } finally {
    syncLoading.value = false
  }
}

// Watch locale change
watch(selectedLocale, () => fetchTranslations())

onMounted(async () => {
  await fetchLanguages()
  await fetchNamespaces()
  await fetchTranslations()
})
</script>

<style scoped>
.translation-page { width: 100%; }
.toolbar-card { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 12px; display: flex; gap: 8px; }
.filter-bar { display: flex; gap: 8px; }
.content-card { min-height: 500px; }
.translation-toolbar { margin-bottom: 12px; }
</style>
```

---

## Task 9: Seed Menu Entries

**Files:**
- Modify: `prisma/seed.ts`

### Step 1: Add language management menu

Find the existing system management children (around id=160 for price-unit) and add:

```typescript
// 语言管理
{ id: 170, name: '语言管理', code: 'system:language', type: 1, parentId: 1, path: '/admin/system/language', icon: 'ChatDotRound', sort: 11, status: 1, visible: 1 },
{ id: 171, name: '语言查询', code: 'system:language:list', type: 2, parentId: 170, sort: 1 },
{ id: 172, name: '语言新增', code: 'system:language:create', type: 2, parentId: 170, sort: 2 },
{ id: 173, name: '语言修改', code: 'system:language:update', type: 2, parentId: 170, sort: 3 },
{ id: 174, name: '语言删除', code: 'system:language:delete', type: 2, parentId: 170, sort: 4 },

// 翻译管理
{ id: 180, name: '翻译管理', code: 'system:translation', type: 1, parentId: 1, path: '/admin/system/translation', icon: 'Translation', sort: 12, status: 1, visible: 1 },
{ id: 181, name: '翻译查询', code: 'system:translation:list', type: 2, parentId: 180, sort: 1 },
{ id: 182, name: '翻译新增', code: 'system:translation:create', type: 2, parentId: 180, sort: 2 },
{ id: 183, name: '翻译修改', code: 'system:translation:update', type: 2, parentId: 180, sort: 3 },
{ id: 184, name: '翻译删除', code: 'system:translation:delete', type: 2, parentId: 180, sort: 4 },
{ id: 185, name: '翻译导出', code: 'system:translation:export', type: 2, parentId: 180, sort: 5 },
{ id: 186, name: '翻译导入', code: 'system:translation:import', type: 2, parentId: 180, sort: 6 },
```

Also add role-permission associations in the seed file's role setup section.

### Step 2: Run seed

```bash
npm run seed
```

---

## Task 10: Import Existing Translations

**Files:**
- Run after seed: POST `/api/admin/translation/import`

### Step 1: Seed language records

Insert the 3 existing languages via the admin UI or direct SQL:

```sql
INSERT INTO sys_language (name, code, is_default, sort, status, create_time, update_time) VALUES
('中文', 'tw', true, 1, 1, NOW(), NOW()),
('English', 'en', false, 2, 1, NOW(), NOW()),
('日本語', 'jp', false, 3, 1, NOW(), NOW());
```

### Step 2: Import from JSON files

Call `POST /api/admin/translation/import` to import existing JSON translations into the database.

### Step 3: Verify

Check `/admin/system/translation` page shows all imported translations.

---

## Task 11: Verification

### Step 1: Type check

```bash
npx nuxi typecheck
```

### Step 2: Manual test

1. Navigate to `/admin/system/language` — verify CRUD works
2. Set a language as default — verify only one can be default
3. Navigate to `/admin/system/translation` — verify translations display correctly
4. Edit a translation value — verify it saves
5. Add a new key — verify it appears in the list
6. Export to JSON — verify `i18n/locales/*.json` files are updated
7. Import from JSON — verify translations are loaded from files
8. Navigate to portal — verify translations still work

### Step 3: Build test

```bash
npm run build
```

---

## File Checklist

| # | File | Action |
|---|------|--------|
| 1 | `prisma/schema.prisma` | Modify (add 2 models) |
| 2 | `shared/types/api.ts` | Modify (add 3 interfaces) |
| 3 | `server/services/language.service.ts` | Create |
| 4 | `server/services/translation.service.ts` | Create |
| 5 | `server/api/admin/language/index.get.ts` | Create |
| 6 | `server/api/admin/language/index.post.ts` | Create |
| 7 | `server/api/admin/language/[id].put.ts` | Create |
| 8 | `server/api/admin/language/[id].delete.ts` | Create |
| 9 | `server/api/admin/language/all.get.ts` | Create |
| 10 | `server/api/admin/language/default.get.ts` | Create |
| 11 | `server/api/admin/translation/index.get.ts` | Create |
| 12 | `server/api/admin/translation/upsert.post.ts` | Create |
| 13 | `server/api/admin/translation/batch.post.ts` | Create |
| 14 | `server/api/admin/translation/key.delete.ts` | Create |
| 15 | `server/api/admin/translation/namespaces.get.ts` | Create |
| 16 | `server/api/admin/translation/export.post.ts` | Create |
| 17 | `server/api/admin/translation/import.post.ts` | Create |
| 18 | `app/pages/admin/system/language.vue` | Create |
| 19 | `app/pages/admin/system/translation.vue` | Create |
| 20 | `prisma/seed.ts` | Modify (add menu entries) |

**Total**: 18 new files, 3 modified files
