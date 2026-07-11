import { dictService } from '../../../services/dict.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const params: any = { page: Number(query.page) || 1, pageSize: Number(query.pageSize) || 10 }
  if (query.dictTypeId) params.dictTypeId = Number(query.dictTypeId)
  if (query.dictCode) params.dictCode = query.dictCode
  if (query.label) params.label = query.label
  if (query.status !== undefined) params.status = Number(query.status)
  return { code: 200, data: await dictService.dataList(params) }
})
