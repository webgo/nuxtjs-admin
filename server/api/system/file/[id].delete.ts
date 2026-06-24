import prisma from '../../../utils/prisma'
import { deleteLocalFile } from '../../../utils/fileStorage'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  const file = await prisma.sysFile.findUnique({ where: { id } })
  if (!file) {
    throw createError({ statusCode: 404, message: '文件不存在' })
  }

  // 软删除：标记状态
  await prisma.sysFile.update({
    where: { id },
    data: { status: 0 },
  })

  // 同时删除磁盘文件
  await deleteLocalFile(file.storageName)

  return { code: 200, msg: '删除成功' }
})
