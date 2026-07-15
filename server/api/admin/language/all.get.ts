import { languageService } from '../../../services/language.service'

export default defineEventHandler(async () => {
  return { code: 200, data: await languageService.listAll() }
})
