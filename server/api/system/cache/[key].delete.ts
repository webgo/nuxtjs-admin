import { cacheDel, getCache } from '../../../utils/cache'

export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, 'key')
  if (!key) {
    throw createError({ statusCode: 400, message: '缺少 key' })
  }

  try {
    const exists = await getCache().exists(key)
    if (!exists) {
      throw createError({ statusCode: 404, message: 'Key 不存在' })
    }

    await cacheDel(key)

    return { code: 200, msg: '删除成功' }
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    throw createError({ statusCode: 503, message: '缓存服务不可用' })
  }
})
