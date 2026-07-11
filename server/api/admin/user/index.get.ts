import { userService } from '../../../services/user.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const params = { page: Number(query.page) || 1, pageSize: Number(query.pageSize) || 10 }
  if (query.username) (params as any).username = query.username
  if (query.status !== undefined) (params as any).status = Number(query.status)
  return { code: 200, data: await userService.list(params) }
})
