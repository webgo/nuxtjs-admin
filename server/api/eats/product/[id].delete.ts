import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  const product = await prisma.sysProduct.findUnique({ where: { id } })
  if (!product) {
    throw createError({ statusCode: 404, message: '商品不存在' })
  }

  await prisma.sysProduct.delete({ where: { id } })

  return { code: 200, msg: '删除成功' }
})
