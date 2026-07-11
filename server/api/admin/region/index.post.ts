import { regionService } from '../../../services/region.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return { code: 200, data: await regionService.create(body) }
})
