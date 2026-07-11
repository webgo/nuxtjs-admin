import prisma from '../utils/prisma'
import { generateStorageName, saveFile } from '../utils/fileStorage'

export const fileService = {
  async upload(files: Array<{ filename: string; data: Buffer; type?: string }>, uploadBy?: number) {
    if (!files || files.length === 0) {
      throw createError({ statusCode: 400, message: '请选择要上传的文件' })
    }

    const results = []
    for (const file of files) {
      const { filename, data, type } = file
      const fileName = filename
      const fileType = type || null
      const extension = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : null
      const fileSize = data.length
      const storageName = generateStorageName(fileName)
      const url = await saveFile(data, storageName)

      const record = await prisma.sysFile.create({
        data: { fileName, storageName, filePath: url, fileSize, fileType, extension, uploadBy: uploadBy || null, status: 1 },
      })
      results.push({
        id: record.id, fileName: record.fileName, filePath: record.filePath,
        fileSize: record.fileSize, fileType: record.fileType,
        extension: record.extension, createTime: record.createTime,
      })
    }
    return results.length === 1 ? results[0] : results
  },

  async list(params: { page: number; pageSize: number; fileName?: string; fileType?: string }) {
    const { page, pageSize, fileName, fileType } = params
    const where: Record<string, unknown> = {}
    if (fileName) where.fileName = { contains: fileName }
    if (fileType) where.fileType = { contains: fileType }

    const [rows, total] = await Promise.all([
      prisma.sysFile.findMany({
        where, skip: (page - 1) * pageSize, take: pageSize,
        orderBy: [{ createTime: 'desc' }],
      }),
      prisma.sysFile.count({ where }),
    ])
    return { list: rows, total, page, pageSize }
  },

  async findById(id: number) {
    const file = await prisma.sysFile.findUnique({ where: { id } })
    if (!file) throw createError({ statusCode: 404, message: '文件不存在' })
    return file
  },

  async delete(id: number) {
    const file = await prisma.sysFile.findUnique({ where: { id } })
    if (!file) throw createError({ statusCode: 404, message: '文件不存在' })
    await prisma.sysFile.delete({ where: { id } })
    return true
  },
}
