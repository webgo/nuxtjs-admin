import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const { name, code, description, sort, status, remark } = body

  const category = await prisma.sysCategory.findUnique({ where: { id } })
  if (!category) {
    throw createError({ statusCode: 404, message: '分类不存在' })
  }

  const data: any = {}
  if (name !== undefined) data.name = name
  if (code !== undefined) {
    const exist = await prisma.sysCategory.findFirst({ where: { code, NOT: { id } } })
    if (exist) throw createError({ statusCode: 409, message: '分类标识已存在' })
    data.code = code
  }
  if (description !== undefined) data.description = description
  if (sort !== undefined) data.sort = sort
  if (status !== undefined) data.status = status
  if (remark !== undefined) data.remark = remark

  await prisma.sysCategory.update({ where: { id }, data })

  return { code: 200, msg: '更新成功' }
})
