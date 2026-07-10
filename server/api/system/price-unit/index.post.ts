import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, symbol, sort, status, remark } = body

  if (!name || !symbol) {
    throw createError({ statusCode: 400, message: '名称和符号不能为空' })
  }

  const unit = await prisma.sysPriceUnit.create({
    data: {
      name,
      symbol,
      sort: sort ?? 0,
      status: status ?? 1,
      remark,
    },
  })

  return { code: 200, msg: '创建成功', data: { id: unit.id } }
})
