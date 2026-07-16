import { addressService } from '../../../services/address.service'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) throw createError({ statusCode: 401, message: '未认证' })

  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, message: '无效地址 ID' })

  await addressService.delete(id, auth.userId)

  return { code: 200, msg: '删除成功' }
})
