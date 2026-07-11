import { contentService } from '../../../services/content.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const params: any = { page: Number(query.page) || 1, pageSize: Number(query.pageSize) || 10 }
  if (query.title) params.title = query.title
  if (query.categoryId !== undefined) params.categoryId = Number(query.categoryId)
  if (query.isRecommended !== undefined) params.isRecommended = Number(query.isRecommended)
  if (query.status !== undefined) params.status = Number(query.status)
  return { code: 200, data: await contentService.list(params) }
})
