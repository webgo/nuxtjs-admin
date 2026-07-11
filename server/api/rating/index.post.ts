import { ratingService } from '../../services/rating.service'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) throw createError({ statusCode: 401, message: '未登录' })
  const body = await readBody(event)
  const result = await ratingService.create({ userId: auth.userId, ...body })
  return { code: 200, msg: '评价成功', data: result }
})
