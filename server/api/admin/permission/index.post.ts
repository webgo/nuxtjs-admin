import { permissionService } from '../../../services/permission.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return { code: 200, data: await permissionService.create(body) }
})
