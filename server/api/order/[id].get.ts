import { orderService } from '../../services/order.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  return { code: 200, data: await orderService.findById(id) }
})
