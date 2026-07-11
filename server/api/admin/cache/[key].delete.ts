import { monitorService } from '../../../services/monitor.service'

export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, 'key')
  await monitorService.cacheDelete(key!)
  return { code: 200, msg: '删除成功' }
})
