import db from '../utils/db'
import { sysTranslation, sysLanguage } from '../../db/schema'
import { eq, asc, and } from 'drizzle-orm'

export const translationService = {
  async listFlat(params: { page: number; pageSize: number; keyword?: string; keySearch?: string; namespace?: string }) {
    const { page, pageSize, keyword, keySearch, namespace } = params
    const conditions: ReturnType<typeof eq>[] = []
    if (namespace) conditions.push(eq(sysTranslation.namespace, namespace))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const rows = await db.select().from(sysTranslation)
      .where(where)
      .orderBy(asc(sysTranslation.namespace), asc(sysTranslation.key), asc(sysTranslation.locale))

    const grouped = new Map<string, { namespace: string; key: string; values: Record<string, string> }>()
    for (const row of rows) {
      const compositeKey = `${row.namespace}::${row.key}`
      let entry = grouped.get(compositeKey)
      if (!entry) {
        entry = { namespace: row.namespace, key: row.key, values: {} }
        grouped.set(compositeKey, entry)
      }
      entry.values[row.locale] = row.value
    }

    let entries = Array.from(grouped.values())

    if (keyword) {
      const kw = keyword.toLowerCase()
      entries = entries.filter(e => Object.values(e.values).some(v => v.toLowerCase().includes(kw)))
    }

    if (keySearch) {
      const ks = keySearch.toLowerCase()
      entries = entries.filter(e => {
        const fullKey = `${e.namespace}.${e.key}`.toLowerCase()
        return fullKey.includes(ks)
      })
    }

    const total = entries.length
    const start = (page - 1) * pageSize
    const paged = entries.slice(start, start + pageSize).map(e => ({
      id: `${e.namespace}::${e.key}`,
      ...e,
      fullKey: `${e.namespace}.${e.key}`,
    }))

    return { list: paged, total, page, pageSize }
  },

  async listByLocale(locale?: string) {
    const conditions: ReturnType<typeof eq>[] = []
    if (locale) conditions.push(eq(sysTranslation.locale, locale))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const rows = await db.select().from(sysTranslation)
      .where(where)
      .orderBy(asc(sysTranslation.namespace), asc(sysTranslation.key), asc(sysTranslation.locale))

    const grouped: Record<string, Record<string, Record<string, string>>> = {}
    for (const row of rows) {
      if (!grouped[row.namespace]) grouped[row.namespace] = {}
      if (!grouped[row.namespace]![row.key]) grouped[row.namespace]![row.key] = {}
      grouped[row.namespace]![row.key]![row.locale] = row.value
    }

    return grouped
  },

  async getNamespaces() {
    const rows = await db.select({ namespace: sysTranslation.namespace })
      .from(sysTranslation)
      .groupBy(sysTranslation.namespace)
      .orderBy(asc(sysTranslation.namespace))
    return rows.map(r => r.namespace)
  },

  async upsert(params: { namespace: string; key: string; locale: string; value: string }) {
    const now = new Date().toISOString().slice(0, 23).replace('T', ' ')
    await db.insert(sysTranslation)
      .values({ ...params, updateTime: now })
      .onDuplicateKeyUpdate({ set: { value: params.value } })
    return params
  },

  async batchUpsert(translations: { namespace: string; key: string; locale: string; value: string }[]) {
    if (translations.length === 0) return []
    const now = new Date().toISOString().slice(0, 23).replace('T', ' ')
    for (const t of translations) {
      await db.insert(sysTranslation)
        .values({ ...t, updateTime: now })
        .onDuplicateKeyUpdate({ set: { value: t.value } })
    }
    return translations
  },

  async deleteKey(namespace: string, key: string) {
    await db.delete(sysTranslation).where(and(eq(sysTranslation.namespace, namespace), eq(sysTranslation.key, key)))
    return true
  },

  async deleteEntry(id: number) {
    await db.delete(sysTranslation).where(eq(sysTranslation.id, id))
    return true
  },

  async exportToJson() {
    const languages = await db.select().from(sysLanguage).where(eq(sysLanguage.status, 1))
    const allTranslations = await db.select().from(sysTranslation)

    const results: { code: string; file: string; keys: number }[] = []

    for (const lang of languages) {
      const localeTranslations = allTranslations.filter(t => t.locale === lang.code)
      const nested: Record<string, unknown> = {}
      for (const t of localeTranslations) {
        const parts = t.namespace.split('.')
        let current = nested
        for (const part of parts) {
          if (!current[part] || typeof current[part] !== 'object') {
            current[part] = {}
          }
          current = current[part] as Record<string, unknown>
        }
        current[t.key] = t.value
      }

      const filePath = `i18n/locales/${lang.code}.json`
      const content = JSON.stringify(nested, null, 2)

      const fs = await import('fs')
      const path = await import('path')
      const fullPath = path.resolve(process.cwd(), filePath)
      fs.mkdirSync(path.dirname(fullPath), { recursive: true })
      fs.writeFileSync(fullPath, content, 'utf-8')

      results.push({ code: lang.code, file: filePath, keys: localeTranslations.length })
    }

    return results
  },

  async importFromJson() {
    const fs = await import('fs')
    const path = await import('path')

    const languages = await db.select().from(sysLanguage)
    const results: { code: string; keys: number }[] = []

    for (const lang of languages) {
      const filePath = path.resolve(process.cwd(), `i18n/locales/${lang.code}.json`)
      if (!fs.existsSync(filePath)) continue

      const content = fs.readFileSync(filePath, 'utf-8')
      const json = JSON.parse(content)

      const flat: Record<string, string> = {}
      function flatten(obj: Record<string, unknown>, prefix = '') {
        for (const [k, v] of Object.entries(obj)) {
          const dotKey = prefix ? `${prefix}.${k}` : k
          if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
            flatten(v as Record<string, unknown>, dotKey)
          } else {
            flat[dotKey] = String(v)
          }
        }
      }
      flatten(json)

      const translations: { namespace: string; key: string; locale: string; value: string }[] = []
      for (const [dotKey, value] of Object.entries(flat)) {
        const lastDot = dotKey.lastIndexOf('.')
        const namespace = lastDot > 0 ? dotKey.substring(0, lastDot) : 'general'
        const key = lastDot > 0 ? dotKey.substring(lastDot + 1) : dotKey
        translations.push({ namespace, key, locale: lang.code, value })
      }

      await this.batchUpsert(translations)
      results.push({ code: lang.code, keys: translations.length })
    }

    return results
  },
}
