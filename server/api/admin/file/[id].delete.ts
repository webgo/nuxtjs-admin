import { fileService } from '../../../services/file.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  await fileService.delete(id)
  return { code: 200, msg: '删除成功' }
})
