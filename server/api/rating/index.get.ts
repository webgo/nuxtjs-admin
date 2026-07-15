import { ratingService } from '../../services/rating.service'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) throw createError({ statusCode: 401, message: '未登录' })
  const query = getQuery(event)
  const params: any = { page: Number(query.page) || 1, pageSize: Number(query.pageSize) || 10 }
  if (query.merchantId) params.merchantId = Number(query.merchantId)
  if (query.rating) params.rating = Number(query.rating)
  return { code: 200, data: await ratingService.list(params) }
})
