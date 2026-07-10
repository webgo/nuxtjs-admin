import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, code, icon, sort } = body

  if (!name || !code) {
    throw createError({ statusCode: 400, message: '名称和编码不能为空' })
  }

  const exist = await prisma.sysMerchantCategory.findUnique({ where: { code } })
  if (exist) {
    throw createError({ statusCode: 409, message: '编码已存在' })
  }

  const record = await prisma.sysMerchantCategory.create({
    data: { name, code, icon, sort: sort ?? 0 },
  })

  return { code: 200, msg: '创建成功', data: { id: record.id } }
})
