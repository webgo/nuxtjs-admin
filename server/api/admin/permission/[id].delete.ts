import { permissionService } from '../../../services/permission.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  await permissionService.delete(id)
  return { code: 200, msg: '删除成功' }
})
