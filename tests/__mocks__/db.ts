import { vi } from 'vitest'

function createChainableMock(data: any = null) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue(Array.isArray(data) ? data : data ? [data] : []),
    then: vi.fn().mockImplementation((resolve) => resolve(Array.isArray(data) ? data : data ? [data] : [])),
  }
  return chain
}

export const mockDb = {
  select: vi.fn(() => createChainableMock()),
  insert: vi.fn(() => createChainableMock()),
  update: vi.fn(() => createChainableMock()),
  delete: vi.fn(() => createChainableMock()),
  execute: vi.fn().mockResolvedValue([]),
}

export function setupDbMock(tables: Record<string, any[]>) {
  mockDb.select.mockImplementation((columns?: any) => {
    const chain = createChainableMock()
    let currentTable: string | null = null

    chain.from.mockImplementation((table: any) => {
      currentTable = table?.name || Object.keys(tables)[0]
      return chain
    })

    chain.where.mockImplementation(() => chain)

    chain.innerJoin.mockImplementation(() => chain)
    chain.leftJoin.mockImplementation(() => chain)
    chain.orderBy.mockImplementation(() => chain)
    chain.groupBy.mockImplementation(() => chain)
    chain.limit.mockImplementation(() => chain)
    chain.offset.mockImplementation(() => chain)

    chain.then.mockImplementation((resolve: any) => {
      const data = tables[currentTable || ''] || []
      resolve(data)
    })

    chain.execute.mockImplementation(() => {
      const data = tables[currentTable || ''] || []
      return Promise.resolve(data)
    })

    return chain
  })

  mockDb.insert.mockImplementation((table: any) => {
    const chain = createChainableMock([{ insertId: 1, affectedRows: 1 }])
    const tableName = table?.name || ''

    chain.values.mockImplementation((data: any) => {
      chain.execute.mockResolvedValue([{ insertId: (tables[tableName]?.length || 0) + 1, affectedRows: 1 }])
      return chain
    })

    return chain
  })

  mockDb.update.mockImplementation((table: any) => {
    const chain = createChainableMock([{ affectedRows: 1 }])
    chain.set.mockImplementation(() => chain)
    chain.where.mockImplementation(() => chain)
    return chain
  })

  mockDb.delete.mockImplementation((table: any) => {
    const chain = createChainableMock([{ affectedRows: 1 }])
    chain.where.mockImplementation(() => chain)
    return chain
  })
}

export function clearAllMocks() {
  mockDb.select.mockClear()
  mockDb.insert.mockClear()
  mockDb.update.mockClear()
  mockDb.delete.mockClear()
  mockDb.execute.mockClear()
}
