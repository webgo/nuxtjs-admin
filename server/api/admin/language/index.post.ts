import { languageService } from '../../../services/language.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return { code: 200, data: await languageService.create(body) }
})
