import db from '../utils/db'
import { sysFile } from '../../db/schema'
import { eq, like, desc, and, count } from 'drizzle-orm'
import { generateStorageName, saveFile } from '../utils/fileStorage'

export const fileService = {
  async upload(files: Array<{ filename: string; data: Buffer; type?: string }>, uploadBy?: number) {
    if (!files || files.length === 0) {
      throw createError({ statusCode: 400, message: '请选择要上传的文件' })
    }

    const results = []
    const now = new Date().toISOString().slice(0, 23).replace('T', ' ')
    for (const file of files) {
      const { filename, data, type } = file
      const fileName = filename
      const fileType = type || null
      const extension = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : null
      const fileSize = data.length
      const storageName = generateStorageName(fileName)
      const url = await saveFile(data, storageName)

      const [result] = await db.insert(sysFile).values({
        fileName, storageName, filePath: url, fileSize, fileType, extension,
        uploadBy: uploadBy || null, status: 1, updateTime: now,
      })
      results.push({
        id: Number(result.insertId), fileName, filePath: url,
        fileSize, fileType, extension, createTime: now,
      })
    }
    return results.length === 1 ? results[0] : results
  },

  async list(params: { page: number; pageSize: number; fileName?: string; fileType?: string }) {
    const { page, pageSize, fileName, fileType } = params
    const conditions: ReturnType<typeof eq>[] = []
    if (fileName) conditions.push(like(sysFile.fileName, `%${fileName}%`))
    if (fileType) conditions.push(like(sysFile.fileType, `%${fileType}%`))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [rows, countResult] = await Promise.all([
      db.select().from(sysFile)
        .where(where)
        .orderBy(desc(sysFile.createTime))
        .offset((page - 1) * pageSize)
        .limit(pageSize),
      db.select({ count: count() }).from(sysFile).where(where),
    ])
    return { list: rows, total: countResult[0]?.count ?? 0, page, pageSize }
  },

  async findById(id: number) {
    const [file] = await db.select().from(sysFile).where(eq(sysFile.id, id))
    if (!file) throw createError({ statusCode: 404, message: '文件不存在' })
    return file
  },

  async delete(id: number) {
    const file = await this.findById(id)
    await db.delete(sysFile).where(eq(sysFile.id, id))
    return true
  },
}
