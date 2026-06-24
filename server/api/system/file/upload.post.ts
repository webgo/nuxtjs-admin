import prisma from '../../../utils/prisma'
import { generateStorageName, saveFile } from '../../../utils/fileStorage'

export default defineEventHandler(async (event) => {
  const body = await readMultipartFormData(event)
  if (!body || body.length === 0) {
    throw createError({ statusCode: 400, message: '请选择要上传的文件' })
  }

  const auth = event.context.auth as { userId: number } | undefined
  const results: any[] = []

  for (const field of body) {
    if (!field.filename) continue

    const buffer = field.data
    const fileName = field.filename
    const fileType = field.type || null
    const extension = fileName.includes('.')
      ? fileName.substring(fileName.lastIndexOf('.'))
      : null
    const fileSize = buffer.length
    const storageName = generateStorageName(fileName)

    const url = await saveFile(buffer, storageName)

    const record = await prisma.sysFile.create({
      data: {
        fileName,
        storageName,
        filePath: url,
        fileSize,
        fileType,
        extension,
        uploadBy: auth?.userId || null,
        status: 1,
      },
    })

    results.push({
      id: record.id,
      fileName: record.fileName,
      filePath: record.filePath,
      fileSize: record.fileSize,
      fileType: record.fileType,
      extension: record.extension,
      createTime: record.createTime,
    })
  }

  return {
    code: 200,
    msg: '上传成功',
    data: results.length === 1 ? results[0] : results,
  }
})
