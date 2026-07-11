import { fileService } from '../../../services/file.service'

export default defineEventHandler(async (event) => {
  const body = await readMultipartFormData(event)
  if (!body || body.length === 0) throw createError({ statusCode: 400, message: '请选择要上传的文件' })
  const auth = event.context.auth
  const files = body.filter(f => f.filename).map(f => ({ filename: f.filename!, data: f.data, type: f.type }))
  if (files.length === 0) throw createError({ statusCode: 400, message: '请选择要上传的文件' })
  const result = await fileService.upload(files, auth?.userId)
  return { code: 200, msg: '上传成功', data: result }
})
