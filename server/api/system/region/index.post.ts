import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, nameTw, nameEn, nameJp, level, parentId, lang, lng, lat, sort, status, remark } = body

  if (!name || !level || !lang) {
    throw createError({ statusCode: 400, message: '名称、层级和语言不能为空' })
  }

  if (parentId) {
    const parent = await prisma.sysRegion.findUnique({ where: { id: parentId } })
    if (!parent) {
      throw createError({ statusCode: 404, message: '上级地区不存在' })
    }
  }

  const record = await prisma.sysRegion.create({
    data: {
      name, nameTw, nameEn, nameJp,
      level, parentId: parentId || null,
      lang, lng, lat,
      sort: sort ?? 0,
      status: status ?? 1,
      remark,
    },
  })

  return { code: 200, msg: '创建成功', data: { id: record.id } }
})
