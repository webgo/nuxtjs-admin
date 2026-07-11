import { dictService } from '../../../services/dict.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  await dictService.dataDelete(id)
  return { code: 200, msg: '删除成功' }
})
