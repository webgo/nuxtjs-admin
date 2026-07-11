import { dictService } from '../../../services/dict.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return { code: 200, data: await dictService.dataCreate(body) }
})
