import { contentService } from '../../../services/content.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return { code: 200, msg: '创建成功', data: await contentService.create(body) }
})
