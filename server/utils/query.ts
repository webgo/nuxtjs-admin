export function stringParam(query: Record<string, unknown>, key: string): string | undefined {
  const val = query[key]
  if (typeof val === 'string' && val.trim()) return val.trim()
  return undefined
}

export function numberParam(query: Record<string, unknown>, key: string): number | undefined {
  const val = query[key]
  if (val !== undefined && val !== null && val !== '') {
    const num = Number(val)
    if (!isNaN(num)) return num
  }
  return undefined
}

export function requiredString(body: Record<string, unknown>, key: string, fieldName: string): string {
  const val = body[key]
  if (typeof val === 'string' && val.trim()) return val.trim()
  throw createError({ statusCode: 400, message: `${fieldName}不能为空` })
}

export function requiredNumber(body: Record<string, unknown>, key: string, fieldName: string): number {
  const val = body[key]
  if (val !== undefined && val !== null && val !== '') {
    const num = Number(val)
    if (!isNaN(num)) return num
  }
  throw createError({ statusCode: 400, message: `${fieldName}不能为空` })
}
