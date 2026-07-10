import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  const record = await prisma.sysRegion.findUnique({ where: { id } })
  if (!record) {
    throw createError({ statusCode: 404, message: '地区不存在' })
  }

  const { name, nameTw, nameEn, nameJp, level, parentId, lang, lng, lat, sort, status, remark } = body

  if (parentId && parentId === id) {
    throw createError({ statusCode: 400, message: '上级地区不能是自己' })
  }

  await prisma.sysRegion.update({
    where: { id },
    data: {
      name, nameTw, nameEn, nameJp,
      level, parentId: parentId || null,
      lang, lng, lat,
      sort, status, remark,
    },
  })

  return { code: 200, msg: '更新成功' }
})
