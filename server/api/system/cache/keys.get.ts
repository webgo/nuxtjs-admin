import { cacheScan, cacheTtl, cacheType, cacheKey, cacheStrlen, cacheLlen, cacheScard, cacheHlen, cacheZcard } from '../../../utils/cache'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const pattern = (query.pattern as string) || '*'
  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 50

  try {
    // 使用 cacheKey 补全前缀（如 online_user:* → nuxtjsadmin:online_user:*）
    const scanPattern = cacheKey(pattern)

    // 使用 SCAN 收集匹配的 key
    const allKeys: string[] = []
    let cursor = '0'
    do {
      const result = await cacheScan(cursor, scanPattern, 200)
      cursor = result.cursor
      allKeys.push(...result.keys)
      if (allKeys.length >= page * pageSize + pageSize) break
    } while (cursor !== '0')

    const total = allKeys.length
    const start = (page - 1) * pageSize
    const pageKeys = allKeys.slice(start, start + pageSize)

    // 批量获取 key 的类型和 TTL
    const items = await Promise.all(
      pageKeys.map(async (key) => {
        const [type, ttl] = await Promise.all([
          cacheType(key),
          cacheTtl(key),
        ])
        let size = '0'
        try {
          if (type === 'string') {
            const len = await cacheStrlen(key)
            size = len < 1024 ? `${len} B` : `${(len / 1024).toFixed(1)} KB`
          } else if (type === 'list') {
            const len = await cacheLlen(key)
            size = `${len} items`
          } else if (type === 'set') {
            const len = await cacheScard(key)
            size = `${len} members`
          } else if (type === 'hash') {
            const len = await cacheHlen(key)
            size = `${len} fields`
          } else if (type === 'zset') {
            const len = await cacheZcard(key)
            size = `${len} members`
          }
        } catch {
          size = '?'
        }
        return { key, type, ttl: ttl >= 0 ? ttl : -1, size }
      }),
    )

    return { code: 200, data: { list: items, total, page, pageSize } }
  } catch {
    // 缓存不可用时优雅降级
    return { code: 200, data: { list: [], total: 0, page, pageSize } }
  }
})
