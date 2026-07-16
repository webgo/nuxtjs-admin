import { addressService } from '../../../services/address.service'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) throw createError({ statusCode: 401, message: '未认证' })

  const list = await addressService.list(auth.userId)

  return { code: 200, msg: 'success', data: list }
})
