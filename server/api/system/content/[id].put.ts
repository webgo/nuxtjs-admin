import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const { title, thumbnail, summary, content, categoryId, isRecommended, status, remark } = body

  const article = await prisma.sysContent.findUnique({ where: { id } })
  if (!article) {
    throw createError({ statusCode: 404, message: '内容不存在' })
  }

  const data: any = {}
  if (title !== undefined) data.title = title
  if (thumbnail !== undefined) data.thumbnail = thumbnail
  if (summary !== undefined) data.summary = summary
  if (content !== undefined) data.content = content
  if (categoryId !== undefined) data.categoryId = categoryId || null
  if (isRecommended !== undefined) data.isRecommended = isRecommended
  if (status !== undefined) data.status = status
  if (remark !== undefined) data.remark = remark

  await prisma.sysContent.update({ where: { id }, data })

  return { code: 200, msg: '更新成功' }
})
