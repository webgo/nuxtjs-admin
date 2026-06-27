import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { dictTypeId, label, value, sort, status, cssClass, remark } = body

  if (!dictTypeId || !label || !value) {
    throw createError({ statusCode: 400, message: '字典类型、标签和值不能为空' })
  }

  const dictData = await prisma.sysDictData.create({
    data: { dictTypeId, label, value, sort: sort ?? 0, status: status ?? 1, cssClass: cssClass ?? '', remark },
  })

  return { code: 200, msg: '创建成功', data: { id: dictData.id } }
})
