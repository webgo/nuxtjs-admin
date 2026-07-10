import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  const record = await prisma.sysProductCategory.findUnique({ where: { id } })
  if (!record) {
    throw createError({ statusCode: 404, message: '商品分类不存在' })
  }

  const productCount = await prisma.sysProduct.count({ where: { categoryId: id } })
  if (productCount > 0) {
    throw createError({ statusCode: 400, message: '该分类下有关联商品，无法删除' })
  }

  await prisma.sysProductCategory.delete({ where: { id } })

  return { code: 200, msg: '删除成功' }
})
