import os from 'node:os'
import * as cacheUtils from '../utils/cache'
import { getKeys, getItem, removeItem } from '../utils/storage'
import db from '../utils/db'
import { sql } from 'drizzle-orm'

export const monitorService = {
  async cacheOverview() {
    const pingOk = await cacheUtils.cachePing()
    if (!pingOk) {
      return { version: '', uptimeInSeconds: 0, usedMemory: '0', usedMemoryHuman: '0 B', totalKeys: 0, connectedClients: 0, hitRate: 'N/A', os: '', arch: '', tcpPort: 6379, available: false }
    }
    const [info, totalKeys] = await Promise.all([cacheUtils.cacheInfo(), cacheUtils.cacheDbSize()])
    const keyspaceHits = Number(info.keyspace_hits) || 0
    const keyspaceMisses = Number(info.keyspace_misses) || 0
    const totalOps = keyspaceHits + keyspaceMisses
    const hitRate = totalOps > 0 ? ((keyspaceHits / totalOps) * 100).toFixed(2) + '%' : 'N/A'
    return {
      version: info.version || '', uptimeInSeconds: Number(info.uptime_in_seconds) || 0,
      usedMemory: info.used_memory || '0', usedMemoryHuman: info.used_memory_human || '0 B',
      totalKeys, connectedClients: Number(info.connected_clients) || 0, hitRate,
      os: info.os || '', arch: info.arch_bits || '', tcpPort: Number(info.tcp_port) || 6379, available: true,
    }
  },

  async cacheSearch(pattern: string, page: number, pageSize: number) {
    const allKeys = await getKeys(pattern.replace(/\*$/, '') || '')
    const keys = allKeys
    const total = keys.length
    const start = (page - 1) * pageSize
    const items = []
    for (const key of keys.slice(start, start + pageSize)) {
      const ttl = await cacheUtils.cacheTtl(key)
      const type = await cacheUtils.cacheType(key)
      items.push({ key, ttl, type })
    }
    return { list: items, total, page, pageSize }
  },

  async cacheDetail(key: string) {
    const type = await cacheUtils.cacheType(key)
    const ttl = await cacheUtils.cacheTtl(key)
    const value = await cacheUtils.cacheGet(key)
    return { key, type, ttl, value }
  },

  async cacheDelete(key: string) {
    return cacheUtils.cacheDel(key)
  },

  async cacheFlushDb() {
    return cacheUtils.cacheFlush()
  },

  async onlineUsers(params: { page: number; pageSize: number; username?: string }) {
    const { page, pageSize, username } = params
    const allKeys = await getKeys('admin_online_user:')

    let users: Array<{
      userId: number; username: string; nickname: string | null
      ip: string; loginTime: string; token: string
    }> = []
    if (allKeys.length > 0) {
      const values = await Promise.all(allKeys.map(k => getItem<{
        userId: number; username: string; nickname: string | null
        ip: string; loginTime: string; token: string
      }>(k)))
      users = values.filter((v): v is NonNullable<typeof v> => v != null)
    }

    if (username) users = users.filter(u => u.username.includes(username))
    users.sort((a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime())

    const total = users.length
    const start = (page - 1) * pageSize
    return { list: users.slice(start, start + pageSize), total, page, pageSize }
  },

  async forceOffline(userId: number) {
    await removeItem(`admin_online_user:${userId}`)
    return true
  },

  async systemInfo() {
    const memUsage = process.memoryUsage()
    const totalMem = os.totalmem()
    const freeMem = os.freemem()

    let dbStatus = 'connected'
    let dbVersion = ''
    try {
      const result = await db.execute(sql`SELECT VERSION() as version`)
      const rows = (result as unknown as Array<{ version: string }>)[0]
      dbVersion = rows?.version || ''
    } catch {
      dbStatus = 'disconnected'
    }

    return {
      uptime: Math.floor(process.uptime()),
      osUptime: Math.floor(os.uptime()),
      memory: {
        rss: memUsage.rss, heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed, external: memUsage.external,
        total: totalMem, free: freeMem,
        usagePercent: ((1 - freeMem / totalMem) * 100).toFixed(1),
      },
      cpu: {
        cores: os.cpus().length, model: os.cpus()[0]?.model || '',
        arch: os.arch(), loadAvg: os.loadavg(),
      },
      os: { hostname: os.hostname(), platform: os.platform(), release: os.release() },
      runtime: { nodeVersion: process.version, pid: process.pid, cwd: process.cwd() },
      database: { status: dbStatus, version: dbVersion },
    }
  },
}
