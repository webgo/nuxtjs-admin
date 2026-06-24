import bcrypt from 'bcryptjs'
import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const { password, nickname, email, phone, status, remark, roleIds } = body

  const user = await prisma.sysUser.findUnique({ where: { id } })
  if (!user) {
    throw createError({ statusCode: 404, message: '用户不存在' })
  }

  const data: any = {}
  if (nickname !== undefined) data.nickname = nickname
  if (email !== undefined) data.email = email
  if (phone !== undefined) data.phone = phone
  if (status !== undefined) data.status = status
  if (remark !== undefined) data.remark = remark
  if (password) {
    data.password = await bcrypt.hash(password, 10)
  }

  // 更新角色关联
  if (roleIds !== undefined) {
    await prisma.sysUserRole.deleteMany({ where: { userId: id } })
    if (roleIds.length > 0) {
      await prisma.sysUserRole.createMany({
        data: roleIds.map((roleId: number) => ({ userId: id, roleId })),
      })
    }
  }

  await prisma.sysUser.update({ where: { id }, data })

  return { code: 200, msg: '更新成功' }
})
