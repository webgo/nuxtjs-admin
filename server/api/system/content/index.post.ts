import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { title, thumbnail, summary, content, categoryId, isRecommended, status, remark } = body

  if (!title) {
    throw createError({ statusCode: 400, message: '内容标题不能为空' })
  }

  const article = await prisma.sysContent.create({
    data: {
      title,
      thumbnail,
      summary,
      content,
      categoryId: categoryId || null,
      isRecommended: isRecommended ?? 0,
      status: status ?? 1,
      remark,
    },
  })

  return { code: 200, msg: '创建成功', data: { id: article.id } }
})
