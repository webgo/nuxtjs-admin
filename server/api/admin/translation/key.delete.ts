import { translationService } from '../../../services/translation.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const namespace = query.namespace as string
  const key = query.key as string
  if (!namespace || !key) throw createError({ statusCode: 400, message: '缺少参数' })
  await translationService.deleteKey(namespace, key)
  return { code: 200, msg: '删除成功' }
})
