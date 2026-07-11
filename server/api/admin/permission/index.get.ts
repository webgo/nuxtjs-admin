import { permissionService } from '../../../services/permission.service'

export default defineEventHandler(async () => {
  return { code: 200, data: await permissionService.tree() }
})
