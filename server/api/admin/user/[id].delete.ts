import { userService } from '../../../services/user.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  await userService.delete(id)
  return { code: 200, msg: '删除成功' }
})
