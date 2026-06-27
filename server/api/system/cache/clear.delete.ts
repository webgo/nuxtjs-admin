import { cacheFlush, cachePing } from '../../../utils/cache'

export default defineEventHandler(async (event) => {
  const pingOk = await cachePing()
  if (!pingOk) {
    return { code: 200, msg: '缓存服务不可用，无需清空' }
  }

  await cacheFlush()

  return { code: 200, msg: '缓存已全部清空' }
})
