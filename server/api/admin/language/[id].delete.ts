import { languageService } from '../../../services/language.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  await languageService.delete(id)
  return { code: 200, msg: '删除成功' }
})
