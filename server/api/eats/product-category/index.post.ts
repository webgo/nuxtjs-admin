import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, merchantId, sort, status, remark } = body

  if (!name || !merchantId) {
    throw createError({ statusCode: 400, message: '名称和商家不能为空' })
  }

  const merchant = await prisma.sysMerchant.findUnique({ where: { id: merchantId } })
  if (!merchant) {
    throw createError({ statusCode: 404, message: '商家不存在' })
  }

  const record = await prisma.sysProductCategory.create({
    data: { name, merchantId, sort: sort ?? 0, status: status ?? 1, remark },
  })

  return { code: 200, msg: '创建成功', data: { id: record.id } }
})
