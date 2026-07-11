import { orderService } from '../../services/order.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const { status } = await readBody(event)
  return { code: 200, data: await orderService.updateStatus(id, status) }
})
