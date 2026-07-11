import { roleService } from '../../../services/role.service'

export default defineEventHandler(async () => {
  return { code: 200, data: await roleService.findAll() }
})
