import { regionService } from '../../../services/region.service'

export default defineEventHandler(async () => {
  return { code: 200, data: await regionService.tree() }
})
