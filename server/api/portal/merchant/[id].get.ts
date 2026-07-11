import { merchantService } from '../../../services/merchant.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  return { code: 200, data: await merchantService.findById(id) }
})
