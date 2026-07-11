import { regionService } from '../../../services/region.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  if (query.tree === 'true' || query.tree === '1') return { code: 200, data: { list: await regionService.tree() } }
  const params: any = { page: Number(query.page) || 1, pageSize: Number(query.pageSize) || 10 }
  if (query.name) params.name = query.name
  if (query.level !== undefined) params.level = Number(query.level)
  if (query.status !== undefined) params.status = Number(query.status)
  return { code: 200, data: await regionService.list(params) }
})
