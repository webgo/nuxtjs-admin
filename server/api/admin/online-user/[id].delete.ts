import { monitorService } from '../../../services/monitor.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  await monitorService.forceOffline(id)
  return { code: 200, msg: '已强制下线' }
})
