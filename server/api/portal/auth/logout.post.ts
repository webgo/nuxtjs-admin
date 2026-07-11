import { getTokenFromHeader } from '../../../utils/jwt'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) {
    throw createError({ statusCode: 401, message: '未登录' })
  }

  try {
    const { removeItem } = await import('../../../utils/storage')
    await removeItem(`portal_online_user:${auth.userId}`)
    const token = getTokenFromHeader(event)
    if (token) {
      await removeItem(`portal_online_token:${token}`)
    }
  } catch (err) {
    console.warn('[Portal Logout] remove online record failed:', (err as Error).message)
  }

  return { code: 200, msg: '已退出登录' }
})
