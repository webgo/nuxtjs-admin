import { authService } from '../../../services/auth.service'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  const menuTree = await authService.getUserMenus(auth.userId)
  return { code: 200, data: menuTree }
})
