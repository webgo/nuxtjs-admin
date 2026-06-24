import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, code, description, sort, status, remark } = body

  if (!name || !code) {
    throw createError({ statusCode: 400, message: '分类名称和标识不能为空' })
  }

  const exist = await prisma.sysCategory.findUnique({ where: { code } })
  if (exist) {
    throw createError({ statusCode: 409, message: '分类标识已存在' })
  }

  const category = await prisma.sysCategory.create({
    data: { name, code, description, sort: sort ?? 0, status: status ?? 1, remark },
  })

  return { code: 200, msg: '创建成功', data: { id: category.id } }
})
