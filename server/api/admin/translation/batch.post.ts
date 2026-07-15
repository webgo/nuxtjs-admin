import { translationService } from '../../../services/translation.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const translations = body.translations as { namespace: string; key: string; locale: string; value: string }[]
  return { code: 200, data: await translationService.batchUpsert(translations) }
})
