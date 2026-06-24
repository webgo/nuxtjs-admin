import os from 'node:os'
import prisma from '../../../utils/prisma'

export default defineEventHandler(async () => {
  const memUsage = process.memoryUsage()
  const totalMem = os.totalmem()
  const freeMem = os.freemem()

  // 测试数据库连接
  let dbStatus = 'connected'
  let dbVersion = ''
  try {
    const result: any = await prisma.$queryRaw`SELECT VERSION() as version`
    dbVersion = result[0]?.version || ''
  } catch {
    dbStatus = 'disconnected'
  }

  return {
    code: 200,
    data: {
      // 运行时间
      uptime: Math.floor(process.uptime()),
      osUptime: Math.floor(os.uptime()),

      // 内存
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        total: totalMem,
        free: freeMem,
        usagePercent: ((1 - freeMem / totalMem) * 100).toFixed(1),
      },

      // CPU
      cpu: {
        cores: os.cpus().length,
        model: os.cpus()[0]?.model || '',
        arch: os.arch(),
        loadAvg: os.loadavg(),
      },

      // 系统
      os: {
        hostname: os.hostname(),
        platform: os.platform(),
        release: os.release(),
      },

      // 运行时
      runtime: {
        nodeVersion: process.version,
        pid: process.pid,
        cwd: process.cwd(),
      },

      // 数据库
      database: {
        status: dbStatus,
        version: dbVersion,
      },
    },
  }
})
