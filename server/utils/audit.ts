import prisma from './prisma'

export interface AuditParams {
  userId: number
  username: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT'
  target: string
  targetId?: number
  detail?: string
  ip?: string
}

export async function writeAuditLog(params: AuditParams) {
  try {
    await prisma.sysAuditLog.create({ data: params })
  } catch (err) {
    console.error('[AuditLog] write failed:', err)
  }
}

export function getAuditCtx(event: { context: Record<string, unknown> }) {
  const auth = event.context.auth as { userId?: number; username?: string } | undefined
  return {
    userId: auth?.userId || 0,
    username: auth?.username || 'unknown',
  }
}
