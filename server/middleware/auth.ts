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

  // 将用户信息注入到 event.context
  event.context.auth = payload
})
