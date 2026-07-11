import { roleService } from '../../../services/role.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  return { code: 200, data: await roleService.findById(id) }
})
