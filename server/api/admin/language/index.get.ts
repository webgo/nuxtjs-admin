import { languageService } from '../../../services/language.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const params: any = { page: Number(query.page) || 1, pageSize: Number(query.pageSize) || 10 }
  if (query.name) params.name = query.name
  if (query.status !== undefined) params.status = Number(query.status)
  return { code: 200, data: await languageService.list(params) }
})
