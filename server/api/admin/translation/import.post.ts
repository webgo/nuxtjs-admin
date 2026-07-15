import { translationService } from '../../../services/translation.service'

export default defineEventHandler(async () => {
  const results = await translationService.importFromJson()
  return { code: 200, data: results, msg: '导入成功' }
})
