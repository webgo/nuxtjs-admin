import { languageService } from '../../../services/language.service'

export default defineEventHandler(async () => {
  const lang = await languageService.getDefault()
  return { code: 200, data: lang }
})
