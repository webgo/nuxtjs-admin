import { hasItem, getItem, removeItem } from '../../../utils/storage'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) throw createError({ statusCode: 401, message: '未认证' })

  const userId = getRouterParam(event, 'userId')
  if (!userId) {
    throw createError({ statusCode: 400, message: '缺少用户 ID' })
  }

  // 检查该用户是否在线
  const exists = await hasItem(`online_user:${userId}`)
  if (!exists) {
    throw createError({ statusCode: 404, message: '该用户不在线' })
  }

  // 获取用户信息，同时删除 token 关联
  const data = await getItem<{ token?: string }>(`online_user:${userId}`)
  if (data?.token) {
    await removeItem(`online_token:${data.token}`)
  }

  // 删除在线记录
  await removeItem(`online_user:${userId}`)

  return { code: 200, msg: '强制下线成功' }
})
