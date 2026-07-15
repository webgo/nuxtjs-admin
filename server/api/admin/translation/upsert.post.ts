import { translationService } from '../../../services/translation.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return { code: 200, data: await translationService.upsert(body) }
})
