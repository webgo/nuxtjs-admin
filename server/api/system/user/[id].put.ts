import bcrypt from "bcryptjs";
import prisma from "../../../utils/prisma";

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));
  const body = await readBody(event);
  const { password, nickname, email, phone, status, remark, roleIds } = body;

  const user = await prisma.sysUser.findUnique({ where: { id } });
  if (!user) {
    throw createError({ statusCode: 404, message: "用户不存在" });
  }

  const data: any = {};
  if (nickname !== undefined) data.nickname = nickname;
  if (email !== undefined) data.email = email;
  if (phone !== undefined) data.phone = phone;
  if (status !== undefined) data.status = status;
  if (remark !== undefined) data.remark = remark;
  if (password) {
    data.password = await bcrypt.hash(password, 10);
  }

  if (status === 0 && user.username === "admin") {
    throw createError({ statusCode: 400, message: "不能禁用超级管理员" });
  }

  // 需要事务保障一致性
  await prisma.$transaction(async (tx) => {
    // 更新角色关联
    if (roleIds !== undefined) {
      await tx.sysUserRole.deleteMany({ where: { userId: id } });
      if (roleIds.length > 0) {
        await tx.sysUserRole.createMany({
          data: roleIds.map((roleId: number) => ({ userId: id, roleId })),
        });
      }
    }
    // 更新用户信息
    await tx.sysUser.update({ where: { id }, data });
  });

  return { code: 200, msg: "更新成功" };
});
