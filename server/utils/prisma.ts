import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

let prisma: PrismaClient

export function getPrisma() {
  if (!prisma) {
    const url = new URL(process.env.DATABASE_URL || 'mysql://root:root@localhost:3306/admin_app')
    const adapter = new PrismaMariaDb({
      user: url.username,
      password: url.password,
      database: url.pathname.replace('/', ''),
      host: url.hostname,
      port: Number(url.port) || 3306,
      connectionLimit: 4,
    })
    prisma = new PrismaClient({ adapter })
  }
  return prisma
}

export default getPrisma()
