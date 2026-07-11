import { priceUnitService } from '../../../services/price-unit.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return { code: 200, data: await priceUnitService.create(body) }
})
