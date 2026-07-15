import { translationService } from '../../../services/translation.service'

export default defineEventHandler(async () => {
  return { code: 200, data: await translationService.getNamespaces() }
})
