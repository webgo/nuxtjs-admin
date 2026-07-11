import { userService } from '../../../services/user.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = await userService.create(body)
  return { code: 200, msg: '创建成功', data: result }
})
