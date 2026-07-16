import db from '../../../utils/db'
import { sysUser } from '../../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) throw createError({ statusCode: 401, message: '未认证' })

  const body = await readBody(event)
  const { nickname, email, phone, avatar } = body

  const data: Record<string, unknown> = {}
  if (nickname !== undefined) data.nickname = nickname
  if (email !== undefined) data.email = email
  if (phone !== undefined) data.phone = phone
  if (avatar !== undefined) data.avatar = avatar

  if (Object.keys(data).length === 0) {
    throw createError({ statusCode: 400, message: '请提供要更新的字段' })
  }

  await db.update(sysUser).set(data).where(eq(sysUser.id, auth.userId))

  const [user] = await db.select({
    id: sysUser.id, username: sysUser.username, nickname: sysUser.nickname,
    email: sysUser.email, phone: sysUser.phone, avatar: sysUser.avatar, status: sysUser.status,
  }).from(sysUser).where(eq(sysUser.id, auth.userId))

  return { code: 200, msg: '更新成功', data: user }
})
