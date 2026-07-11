import { dictService } from '../../../services/dict.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  return { code: 200, data: await dictService.dataUpdate(id, body) }
})
