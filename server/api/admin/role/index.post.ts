import { roleService } from '../../../services/role.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return { code: 200, data: await roleService.create(body) }
})
