import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const { name, code, icon, sort, status, remark } = body

  const record = await prisma.sysMerchantCategory.findUnique({ where: { id } })
  if (!record) {
    throw createError({ statusCode: 404, message: '商家分类不存在' })
  }

  if (code && code !== record.code) {
    const exist = await prisma.sysMerchantCategory.findUnique({ where: { code } })
    if (exist) {
      throw createError({ statusCode: 409, message: '编码已存在' })
    }
  }

  await prisma.sysMerchantCategory.update({
    where: { id },
    data: { name, code, icon, sort, status, remark },
  })

  return { code: 200, msg: '更新成功' }
})
