import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const { dictTypeId, label, value, sort, status, cssClass, remark } = body

  const dictData = await prisma.sysDictData.findUnique({ where: { id } })
  if (!dictData) {
    throw createError({ statusCode: 404, message: '字典数据不存在' })
  }

  const data: any = {}
  if (dictTypeId !== undefined) data.dictTypeId = dictTypeId
  if (label !== undefined) data.label = label
  if (value !== undefined) data.value = value
  if (sort !== undefined) data.sort = sort
  if (status !== undefined) data.status = status
  if (cssClass !== undefined) data.cssClass = cssClass
  if (remark !== undefined) data.remark = remark

  await prisma.sysDictData.update({ where: { id }, data })

  return { code: 200, msg: '更新成功' }
})
