import { randomUUID } from 'node:crypto'
import { writeFile, unlink, mkdir } from 'node:fs/promises'
import path from 'node:path'

const UPLOAD_DIR = path.resolve('public/uploads')

async function ensureDir() {
  await mkdir(UPLOAD_DIR, { recursive: true })
}

/**
 * 生成唯一的存储文件名
 */
export function generateStorageName(originalName: string): string {
  const ext = path.extname(originalName) || ''
  return `${randomUUID()}${ext}`
}

/**
 * 保存文件到本地磁盘，返回可公开访问的 URL 路径
 */
export async function saveFile(buffer: Buffer, storageName: string): Promise<string> {
  await ensureDir()
  const filePath = path.join(UPLOAD_DIR, storageName)
  await writeFile(filePath, buffer)
  return `/uploads/${storageName}`
}

/**
 * 删除本地文件（忽略文件不存在的错误）
 */
export async function deleteLocalFile(storageName: string): Promise<void> {
  const filePath = path.join(UPLOAD_DIR, storageName)
  await unlink(filePath).catch(() => {})
}

/**
 * 从 multipart body 中提取第一个上传文件的 buffer 和原始文件名
 */
export function extractFileFromBody(body: any): { buffer: Buffer; fileName: string } | null {
  // multipart 格式：body 是一个由 readMultipartFormData 解析的数组
  const fileField = Array.isArray(body)
    ? body.find((f: any) => f.filename)
    : null
  if (!fileField) return null
  return {
    buffer: fileField.data,
    fileName: fileField.filename || 'unnamed',
  }
}
