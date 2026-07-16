import { vi } from 'vitest'

function createModelMock() {
  return {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn(),
    upsert: vi.fn(),
  }
}

export const mockPrisma = {
  sysUser: createModelMock(),
  sysRole: createModelMock(),
  sysUserRole: createModelMock(),
  sysRolePermission: createModelMock(),
  sysPermission: createModelMock(),
  sysUserMenu: createModelMock(),
  sysMerchant: createModelMock(),
  sysMerchantCategory: createModelMock(),
  sysProduct: createModelMock(),
  sysProductSpec: createModelMock(),
  sysProductCategory: createModelMock(),
  sysOrder: createModelMock(),
  sysOrderItem: createModelMock(),
  sysCart: createModelMock(),
  sysRating: createModelMock(),
  sysDictType: createModelMock(),
  sysDictData: createModelMock(),
  sysFile: createModelMock(),
  sysAuditLog: createModelMock(),
  sysNotification: createModelMock(),
  sysCategory: createModelMock(),
  sysContent: createModelMock(),
  sysRegion: createModelMock(),
  sysPriceUnit: createModelMock(),
  $transaction: vi.fn(),
}

export function clearAllMocks() {
  Object.values(mockPrisma).forEach((model) => {
    if (typeof model === 'object' && model !== null && !('$transaction' in model)) {
      Object.values(model).forEach((fn) => {
        if (typeof fn === 'function' && 'mockClear' in fn) {
          fn.mockClear()
        }
      })
    }
  })
}
