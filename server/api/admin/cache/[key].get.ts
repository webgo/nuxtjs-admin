import { monitorService } from '../../../services/monitor.service'

export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, 'key')
  if (!key) throw createError({ statusCode: 400, message: 'key 不能为空' })
  return { code: 200, data: await monitorService.cacheDetail(key) }
})
