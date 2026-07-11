import { orderService } from '../../services/order.service'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  const query = getQuery(event)
  const params: any = { page: Number(query.page) || 1, pageSize: Number(query.pageSize) || 10 }
  if (auth.userType !== 1) params.userId = auth.userId
  if (query.merchantId !== undefined) params.merchantId = Number(query.merchantId)
  if (query.status) params.status = query.status
  if (query.orderNo) params.orderNo = query.orderNo
  return { code: 200, data: await orderService.list(params) }
})
