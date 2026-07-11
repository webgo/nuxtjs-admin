import { regionService } from '../../../services/region.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  await regionService.delete(id)
  return { code: 200, msg: '删除成功' }
})
