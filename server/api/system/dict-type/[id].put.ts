import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const { name, code, status, remark } = body

  const dictType = await prisma.sysDictType.findUnique({ where: { id } })
  if (!dictType) {
    throw createError({ statusCode: 404, message: '字典类型不存在' })
  }

  const data: any = {}
  if (name !== undefined) data.name = name
  if (code !== undefined) {
    const exist = await prisma.sysDictType.findFirst({ where: { code, NOT: { id } } })
    if (exist) throw createError({ statusCode: 409, message: '字典标识已存在' })
    data.code = code
  }
  if (status !== undefined) data.status = status
  if (remark !== undefined) data.remark = remark

  await prisma.sysDictType.update({ where: { id }, data })

  return { code: 200, msg: '更新成功' }
})
