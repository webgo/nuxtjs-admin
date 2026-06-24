import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, code, status, remark } = body

  if (!name || !code) {
    throw createError({ statusCode: 400, message: '字典名称和标识不能为空' })
  }

  const exist = await prisma.sysDictType.findUnique({ where: { code } })
  if (exist) {
    throw createError({ statusCode: 409, message: '字典标识已存在' })
  }

  const dictType = await prisma.sysDictType.create({
    data: { name, code, status: status ?? 1, remark },
  })

  return { code: 200, msg: '创建成功', data: { id: dictType.id } }
})
