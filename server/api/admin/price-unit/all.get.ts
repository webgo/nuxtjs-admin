import { priceUnitService } from '../../../services/price-unit.service'

export default defineEventHandler(async () => {
  return { code: 200, data: await priceUnitService.findAll() }
})
