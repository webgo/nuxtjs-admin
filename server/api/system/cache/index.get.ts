import { cacheInfo, cacheDbSize, cachePing } from '../../../utils/cache'

export default defineEventHandler(async (event) => {
  // 检查缓存服务是否可用
  const pingOk = await cachePing()
  if (!pingOk) {
    return {
      code: 200,
      data: {
        version: '',
        uptimeInSeconds: 0,
        usedMemory: '0',
        usedMemoryHuman: '0 B',
        totalKeys: 0,
        connectedClients: 0,
        hitRate: 'N/A',
        os: '',
        arch: '',
        tcpPort: 6379,
        available: false,
      },
    }
  }

  const [info, totalKeys] = await Promise.all([
    cacheInfo(),
    cacheDbSize(),
  ])

  // 计算命中率
  const keyspaceHits = Number(info.keyspace_hits) || 0
  const keyspaceMisses = Number(info.keyspace_misses) || 0
  const totalOps = keyspaceHits + keyspaceMisses
  const hitRate = totalOps > 0 ? ((keyspaceHits / totalOps) * 100).toFixed(2) + '%' : 'N/A'

  return {
    code: 200,
    data: {
      version: info.version || '',
      uptimeInSeconds: Number(info.uptime_in_seconds) || 0,
      usedMemory: info.used_memory || '0',
      usedMemoryHuman: info.used_memory_human || '0 B',
      totalKeys,
      connectedClients: Number(info.connected_clients) || 0,
      hitRate,
      os: info.os || '',
      arch: info.arch_bits || '',
      tcpPort: Number(info.tcp_port) || 6379,
      available: true,
    },
  }
})
