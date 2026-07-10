import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const { name, sort, status, remark } = body

  const record = await prisma.sysProductCategory.findUnique({ where: { id } })
  if (!record) {
    throw createError({ statusCode: 404, message: '商品分类不存在' })
  }

  await prisma.sysProductCategory.update({
    where: { id },
    data: { name, sort, status, remark },
  })

  return { code: 200, msg: '更新成功' }
})
