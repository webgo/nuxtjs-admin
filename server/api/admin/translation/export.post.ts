import { translationService } from '../../../services/translation.service'

export default defineEventHandler(async () => {
  const results = await translationService.exportToJson()
  return { code: 200, data: results, msg: '导出成功' }
})
