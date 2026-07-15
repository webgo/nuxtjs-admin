import prisma from '../utils/prisma'

export const translationService = {
  async listFlat(params: { page: number; pageSize: number; keyword?: string; keySearch?: string; namespace?: string }) {
    const { page, pageSize, keyword, keySearch, namespace } = params
    const where: Record<string, unknown> = {}
    if (namespace) where.namespace = namespace

    const rows = await prisma.sysTranslation.findMany({
      where,
      orderBy: [{ namespace: 'asc' }, { key: 'asc' }, { locale: 'asc' }],
    })

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
    const where: Record<string, unknown> = {}
    if (locale) where.locale = locale

    const rows = await prisma.sysTranslation.findMany({
      where,
      orderBy: [{ namespace: 'asc' }, { key: 'asc' }, { locale: 'asc' }],
    })

    const grouped: Record<string, Record<string, Record<string, string>>> = {}
    for (const row of rows) {
      if (!grouped[row.namespace]) grouped[row.namespace] = {}
      if (!grouped[row.namespace]![row.key]) grouped[row.namespace]![row.key] = {}
      grouped[row.namespace]![row.key]![row.locale] = row.value
    }

    return grouped
  },

  async getNamespaces() {
    const result = await prisma.sysTranslation.findMany({
      select: { namespace: true },
      distinct: ['namespace'],
      orderBy: [{ namespace: 'asc' }],
    })
    return result.map(r => r.namespace)
  },

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

  async deleteKey(namespace: string, key: string) {
    await prisma.sysTranslation.deleteMany({ where: { namespace, key } })
    return true
  },

  async deleteEntry(id: number) {
    await prisma.sysTranslation.delete({ where: { id } })
    return true
  },

  async exportToJson() {
    const languages = await prisma.sysLanguage.findMany({ where: { status: 1 } })
    const allTranslations = await prisma.sysTranslation.findMany()

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

    const languages = await prisma.sysLanguage.findMany()
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
