import { getKeys, getItem } from '../../../utils/storage'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) throw createError({ statusCode: 401, message: '未认证' })

  const query = getQuery(event)
  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 20
  const username = (query.username as string) || ''

  // 获取所有 online_user: 前缀的 key
  const allKeys = await getKeys('online_user:')

  // 批量获取在线用户数据（已自动反序列化）
  let users: Array<{
    userId: number; username: string; nickname: string | null
    ip: string; loginTime: string; token: string
  }> = []

  if (allKeys.length > 0) {
    const values = await Promise.all(allKeys.map(k => getItem<{
      userId: number; username: string; nickname: string | null
      ip: string; loginTime: string; token: string
    }>(k)))
    users = values.filter((v): v is NonNullable<typeof v> => v != null)
  }

  // 过滤用户名
  if (username) {
    users = users.filter(u => u.username.includes(username))
  }

  // 按登录时间降序
  users.sort((a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime())

  const total = users.length
  const start = (page - 1) * pageSize
  const list = users.slice(start, start + pageSize)

  return { code: 200, data: { list, total, page, pageSize } }
})
