import bcrypt from 'bcryptjs'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) throw createError({ statusCode: 401, message: '未认证' })

  const { oldPassword, newPassword } = await readBody(event)

  if (!oldPassword || !newPassword) {
    throw createError({ statusCode: 400, message: '请填写旧密码和新密码' })
  }
  if (newPassword.length < 6) {
    throw createError({ statusCode: 400, message: '新密码至少6位' })
  }

  const user = await prisma.sysUser.findUnique({ where: { id: auth.userId } })
  if (!user) throw createError({ statusCode: 404, message: '用户不存在' })

  const valid = await bcrypt.compare(oldPassword, user.password)
  if (!valid) throw createError({ statusCode: 400, message: '旧密码错误' })

  const hashed = await bcrypt.hash(newPassword, 10)
  await prisma.sysUser.update({ where: { id: auth.userId }, data: { password: hashed } })

  return { code: 200, msg: '密码修改成功' }
})
