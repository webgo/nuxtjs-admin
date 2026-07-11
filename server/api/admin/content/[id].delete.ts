import { contentService } from '../../../services/content.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  await contentService.delete(id)
  return { code: 200, msg: '删除成功' }
})
