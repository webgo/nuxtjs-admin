import bcrypt from 'bcryptjs'
import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password, nickname, email, phone, status, remark, roleIds } = body

  if (!username || !password) {
    throw createError({ statusCode: 400, message: '用户名和密码不能为空' })
  }

  const exist = await prisma.sysUser.findUnique({ where: { username } })
  if (exist) {
    throw createError({ statusCode: 409, message: '用户名已存在' })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.sysUser.create({
    data: {
      username,
      password: hashedPassword,
      nickname,
      email,
      phone,
      status: status ?? 1,
      remark,
      roles: roleIds?.length ? {
        create: roleIds.map((roleId: number) => ({ roleId })),
      } : undefined,
    },
  })

  return { code: 200, msg: '创建成功', data: { id: user.id } }
})
