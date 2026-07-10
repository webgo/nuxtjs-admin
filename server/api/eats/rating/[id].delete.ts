import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) {
    throw createError({ statusCode: 401, message: '未登录' })
  }

  const id = Number(getRouterParam(event, 'id'))

  const rating = await prisma.sysRating.findUnique({ where: { id } })
  if (!rating) {
    throw createError({ statusCode: 404, message: '评价不存在' })
  }

  // Allow admin or the rating creator to delete
  if (rating.userId !== auth.id) {
    throw createError({ statusCode: 403, message: '无权删除' })
  }

  await prisma.sysRating.delete({ where: { id } })

  const stats = await prisma.sysRating.aggregate({
    where: { merchantId: rating.merchantId },
    _avg: { rating: true },
    _count: { rating: true },
  })
  await prisma.sysMerchant.update({
    where: { id: rating.merchantId },
    data: {
      rating: stats._avg.rating ? Number(stats._avg.rating.toFixed(1)) : 0,
      ratingCount: stats._count.rating,
    },
  })

  return { code: 200, msg: '删除成功' }
})
