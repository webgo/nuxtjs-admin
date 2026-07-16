import db from '../../../utils/db'
import { sysUser } from '../../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) {
    throw createError({ statusCode: 401, message: '未登录' })
  }

  const [user] = await db.select({
    id: sysUser.id, username: sysUser.username, nickname: sysUser.nickname,
    email: sysUser.email, phone: sysUser.phone, avatar: sysUser.avatar,
    status: sysUser.status, userType: sysUser.userType,
  }).from(sysUser).where(eq(sysUser.id, auth.userId))

  if (!user) {
    throw createError({ statusCode: 404, message: '用户不存在' })
  }

  return {
    code: 200,
    data: { user },
  }
})
