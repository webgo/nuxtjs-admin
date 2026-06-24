import { writeAuditLog, getAuditCtx } from '../utils/audit'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('beforeResponse', async (event) => {
    const method = event.method
    // 只记录写操作
    if (!['POST', 'PUT', 'DELETE'].includes(method)) return
    // 排除认证接口和文件上传
    const path = getRequestURL(event).pathname
    if (path.startsWith('/api/auth/')) return
    if (path === '/api/system/file/upload') return
    if (!path.startsWith('/api/')) return

    const ctx = getAuditCtx(event)
    if (!ctx.userId) return

    // 从路由提取目标类型
    const segments = path.replace('/api/', '').split('/')
    const target = segments[1] || 'unknown'

    // 从已读取的 body 中提取参数（如果 body 已被 parse）
    let bodyDetail: string | undefined
    try {
      const body = await readBody(event).catch(() => null)
      if (body) {
        bodyDetail = JSON.stringify(body)
      }
    } catch {
      // 跳过无 body 的请求
    }

    await writeAuditLog({
      userId: ctx.userId,
      username: ctx.username,
      action: method === 'POST' ? 'CREATE' : method === 'PUT' ? 'UPDATE' : 'DELETE',
      target,
      detail: bodyDetail,
    })
  })
})
