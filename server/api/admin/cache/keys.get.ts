import { monitorService } from '../../../services/monitor.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { key: pattern = '*', page = '1', pageSize = '10' } = query
  return { code: 200, data: await monitorService.cacheSearch(String(pattern), Number(page), Number(pageSize)) }
})
