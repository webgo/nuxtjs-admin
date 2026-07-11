import { roleService } from '../../../services/role.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  await roleService.delete(id)
  return { code: 200, msg: '删除成功' }
})
