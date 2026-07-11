import { fileService } from '../../../services/file.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const params: any = { page: Number(query.page) || 1, pageSize: Number(query.pageSize) || 10 }
  if (query.fileName) params.fileName = query.fileName
  if (query.fileType) params.fileType = query.fileType
  return { code: 200, data: await fileService.list(params) }
})
