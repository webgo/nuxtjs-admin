import { userService } from '../../../services/user.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  return { code: 200, data: await userService.findById(id) }
})
