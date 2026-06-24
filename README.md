# Nuxtjs-Admin

基于 Nuxt 4 的通用后台管理脚手架（RuoYi 风格），用于快速搭建业务模块。

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Nuxt 4 (Vue 3 + Vite + Nitro) |
| UI | Element Plus |
| ORM | Prisma 7 + MariaDB |
| 数据库 | MySQL 8.0 |
| 认证 | JWT (jsonwebtoken + bcryptjs) |
| 测试 | Vitest + @nuxt/test-utils |
| 导出 | ExcelJS |
| 语言 | TypeScript (strict mode) |

## 前置要求

- Node.js >= 18
- MySQL 8.0
- npm

## 快速开始

```bash
# 1. 配置环境变量
cp .env.example .env
# 编辑 .env，填入你的数据库连接信息和 JWT 密钥
# DATABASE_URL="mysql://root:your_password@localhost:3306/admin_app"
# JWT_SECRET="your-secret-key-here"

# 2. 安装依赖
npm install

# 3. 确保 MySQL 已运行，创建数据库 (utf8mb4 编码)
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS admin_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 4. 运行数据库迁移（自动生成 Prisma Client）
npx prisma migrate dev

# 5. 初始化种子数据（创建默认管理员账号和菜单）
npm run seed

# 6. 启动开发服务器
npm run dev
# 浏览器打开 http://localhost:3000
# 默认管理员: admin / admin123
```

## 默认账号

| 用户名 | 密码 | 角色 |
|---|---|---|
| admin | admin123 | 超级管理员 |

## 主要功能

- **认证**: 登录/登出，JWT 令牌，路由守卫
- **RBAC**: 目录/菜单/按钮三级权限模型
- **用户管理**: 用户 CRUD，角色分配
- **角色管理**: 角色 CRUD，权限分配
- **菜单管理**: 权限树维护
- **字典管理**: 字典类型/数据维护
- **文件管理**: 文件上传/预览/下载/删除，路径复制
- **内容管理**: 分类/内容管理
- **审计日志**: 自动记录写操作，支持 JSON 详情查看
- **通知中心**: 通知列表，未读计数，标记已读
- **服务器监控**: 系统运行状态
- **个人中心**: 资料编辑，头像上传，密码修改
- **数据导出**: 通用 Excel 导出工具

## 开发命令

```bash
npm run dev        # 开发服务器
npm run build      # 构建
npm run seed       # 种子数据
npm run test       # 运行测试
npm run test:watch # 监听模式测试
npm run typecheck  # 类型检查

# Prisma
npx prisma migrate dev --name <描述>  # 创建迁移
npx prisma studio                      # 数据库管理 UI
```

## 项目结构

```
shared/types/api.ts    前后端共享类型
prisma/                schema + migrations + seed
server/
  middleware/auth.ts    JWT 认证中间件
  plugins/audit.ts     审计日志插件
  utils/               prisma, jwt, audit, fileStorage
  api/                 接口路由
app/
  layouts/admin.vue    后台布局
  components/          通用组件
  composables/         useRequest, useFileUpload, useExport
  stores/auth.ts       认证状态
  pages/               页面
tests/                 Vitest 测试
```

## API 响应格式

```json
{ "code": 200, "msg": "success", "data": { ... } }
{ "code": 200, "data": { "list": [...], "total": N, "page": 1, "pageSize": 10 } }
```
