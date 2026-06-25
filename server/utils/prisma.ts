import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

let prisma: PrismaClient;

export function getPrisma() {
  if (!prisma) {
    const url = new URL(
      process.env.DATABASE_URL || "mysql://root:root@localhost:3306/admin_app",
    );

    const allowPublicKeyRetrieval = url.searchParams.get("allowPublicKeyRetrieval") === "true";
    const sslEnabled = url.searchParams.get("ssl") === "true";

    const adapter = new PrismaMariaDb({
      user: url.username,                                          // 数据库用户名
      password: url.password,                                      // 数据库密码
      database: url.pathname.replace("/", ""),                     // 数据库名
      host: url.hostname,                                          // 数据库主机
      port: Number(url.port) || 3306,                              // 数据库端口
      connectionLimit: 20,                                         // 连接池最大连接数
      allowPublicKeyRetrieval,                                     // MySQL 8+ 允许获取公钥
      ssl: sslEnabled,                                             // 是否启用 SSL
      connectTimeout: 5000,                                        // 连接超时（毫秒）
      idleTimeout: 240,                                            // 空闲连接释放时间（秒）
    });
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}

export default getPrisma();
