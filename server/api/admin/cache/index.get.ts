import { monitorService } from '../../../services/monitor.service'

export default defineEventHandler(async () => {
  return { code: 200, data: await monitorService.cacheOverview() }
})
