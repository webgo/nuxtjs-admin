import { getTokenFromHeader } from '../../utils/jwt'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth

  if (auth?.userId) {
    try {
      const { removeItem } = await import('../../utils/storage')
      const token = getTokenFromHeader(event)
      if (token) {
        await removeItem(`online_token:${token}`)
      }
      await removeItem(`online_user:${auth.userId}`)
    } catch {
      // 存储不可用时不影响退出
    }
  }

  return {
    code: 200,
    msg: '退出成功',
  }
})