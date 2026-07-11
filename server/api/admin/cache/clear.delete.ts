import { monitorService } from '../../../services/monitor.service'

export default defineEventHandler(async () => {
  await monitorService.cacheFlushDb()
  return { code: 200, msg: '已清空全部缓存' }
})
