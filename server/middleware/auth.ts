import { verifyToken, getTokenFromHeader } from '../utils/jwt'

// 不需要认证的路由白名单
const publicPaths = [
  '/api/auth/login',
]

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname || event.node.req.url || ''

  // 静态文件放行
  if (!path.startsWith('/api/')) return
  // 白名单放行
  if (publicPaths.some(p => path.startsWith(p))) return

  // 验证 token
  const token = getTokenFromHeader(event)
  if (!token) {
    throw createError({ statusCode: 401, message: '未登录或 token 已过期' })
  }

  const payload = verifyToken(token)
  if (!payload) {
    throw createError({ statusCode: 401, message: 'token 无效或已过期' })
  }

  // 校验存储中是否仍存在该 token 的在线记录
  // 防止管理员强制下线用户后，JWT 仍有效的问题
  // 存储不可用时降级为仅依赖 JWT 校验
  try {
    const { hasItem } = await import('../utils/storage')
    const exists = await hasItem(`online_token:${token}`)
    if (!exists) {
      throw createError({ statusCode: 401, message: '登录已过期，请重新登录' })
    }
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    console.warn('[Auth] Storage check failed, fallback to JWT only:', (err as Error).message)
  }

  // 将用户信息注入到 event.context
  event.context.auth = payload
})
