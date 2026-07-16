import { addressService } from '../../../services/address.service'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) throw createError({ statusCode: 401, message: '未认证' })

  const body = await readBody(event)
  const { name, phone, detail, label, province, city, district, isDefault } = body

  if (!name || !phone || !detail) {
    throw createError({ statusCode: 400, message: '收件人、电话和详细地址为必填' })
  }

  const address = await addressService.create({
    userId: auth.userId,
    label,
    name,
    phone,
    province,
    city,
    district,
    detail,
    isDefault,
  })

  return { code: 200, msg: '添加成功', data: address }
})
