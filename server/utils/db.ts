import mysql from 'mysql2'
import { drizzle } from 'drizzle-orm/mysql2'
import * as schema from '../../db/schema'
import * as relations from '../../db/relations'

let db: ReturnType<typeof drizzle>

export function getDb() {
  if (!db) {
    const url = process.env.DATABASE_URL || 'mysql://root:root@localhost:3306/admin_app'
    const parsedUrl = new URL(url)

    const pool = mysql.createPool({
      host: parsedUrl.hostname,
      port: Number(parsedUrl.port) || 3306,
      user: parsedUrl.username,
      password: parsedUrl.password,
      database: parsedUrl.pathname.replace('/', ''),
      connectionLimit: 20,
      waitForConnections: true,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    })

    db = drizzle(pool, { schema: { ...schema, ...relations }, mode: 'default' })
  }
  return db
}

export default getDb()
