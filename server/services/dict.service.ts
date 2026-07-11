import prisma from '../utils/prisma'

export const dictService = {
  async typeList(params: { page: number; pageSize: number; name?: string; code?: string; status?: number }) {
    const { page, pageSize, name, code, status } = params
    const where: Record<string, unknown> = {}
    if (name) where.name = { contains: name }
    if (code) where.code = { contains: code }
    if (status !== undefined) where.status = status

    const [rows, total] = await Promise.all([
      prisma.sysDictType.findMany({
        where, skip: (page - 1) * pageSize, take: pageSize,
        orderBy: [{ createTime: 'desc' }],
        include: { _count: { select: { data: true } } },
      }),
      prisma.sysDictType.count({ where }),
    ])
    const list = rows.map(d => ({
      id: d.id, name: d.name, code: d.code,
      status: d.status, remark: d.remark,
      createTime: d.createTime, updateTime: d.updateTime,
      dataCount: d._count.data,
    }))
    return { list, total, page, pageSize }
  },

  async typeFindById(id: number) {
    const dictType = await prisma.sysDictType.findUnique({ where: { id } })
    if (!dictType) throw createError({ statusCode: 404, message: '字典类型不存在' })
    return dictType
  },

  async typeCreate(params: { name: string; code: string; status?: number; remark?: string }) {
    const existing = await prisma.sysDictType.findUnique({ where: { code: params.code } })
    if (existing) throw createError({ statusCode: 409, message: '字典类型编码已存在' })
    return prisma.sysDictType.create({ data: params })
  },

  async typeUpdate(id: number, params: { name?: string; code?: string; status?: number; remark?: string }) {
    const dictType = await prisma.sysDictType.findUnique({ where: { id } })
    if (!dictType) throw createError({ statusCode: 404, message: '字典类型不存在' })
    if (params.code && params.code !== dictType.code) {
      const existing = await prisma.sysDictType.findUnique({ where: { code: params.code } })
      if (existing) throw createError({ statusCode: 409, message: '字典类型编码已存在' })
    }
    await prisma.sysDictType.update({ where: { id }, data: params })
    return this.typeFindById(id)
  },

  async typeDelete(id: number) {
    const dictType = await prisma.sysDictType.findUnique({ where: { id } })
    if (!dictType) throw createError({ statusCode: 404, message: '字典类型不存在' })
    await prisma.sysDictData.deleteMany({ where: { dictTypeId: id } })
    await prisma.sysDictType.delete({ where: { id } })
    return true
  },

  async dataList(params: { page?: number; pageSize?: number; dictTypeId?: number; dictCode?: string; label?: string; status?: number }) {
    const { page = 1, pageSize = 10, dictTypeId, dictCode, label, status } = params
    const where: Record<string, unknown> = {}
    if (dictTypeId) where.dictTypeId = dictTypeId
    if (dictCode) where.dictType = { code: dictCode }
    if (label) where.label = { contains: label }
    if (status !== undefined) where.status = status

    const [rows, total] = await Promise.all([
      prisma.sysDictData.findMany({
        where, skip: (page - 1) * pageSize, take: pageSize,
        orderBy: [{ sort: 'asc' }, { id: 'asc' }],
        include: { dictType: { select: { name: true, code: true } } },
      }),
      prisma.sysDictData.count({ where }),
    ])

    const list = rows.map(d => ({
      id: d.id, dictTypeId: d.dictTypeId,
      dictName: d.dictType.name, dictCode: d.dictType.code,
      label: d.label, value: d.value, sort: d.sort,
      status: d.status, cssClass: d.cssClass, remark: d.remark,
      createTime: d.createTime, updateTime: d.updateTime,
    }))
    return { list, total, page, pageSize }
  },

  async dataFindById(id: number) {
    const dictData = await prisma.sysDictData.findUnique({ where: { id } })
    if (!dictData) throw createError({ statusCode: 404, message: '字典数据不存在' })
    return dictData
  },

  async dataCreate(params: { dictTypeId: number; label: string; value: string; sort?: number; status?: number; cssClass?: string; remark?: string }) {
    return prisma.sysDictData.create({ data: params })
  },

  async dataUpdate(id: number, params: { label?: string; value?: string; sort?: number; status?: number; cssClass?: string; remark?: string }) {
    const dictData = await prisma.sysDictData.findUnique({ where: { id } })
    if (!dictData) throw createError({ statusCode: 404, message: '字典数据不存在' })
    await prisma.sysDictData.update({ where: { id }, data: params })
    return this.dataFindById(id)
  },

  async dataDelete(id: number) {
    const dictData = await prisma.sysDictData.findUnique({ where: { id } })
    if (!dictData) throw createError({ statusCode: 404, message: '字典数据不存在' })
    await prisma.sysDictData.delete({ where: { id } })
    return true
  },

  async getDataByTypeCode(code: string) {
    const dictType = await prisma.sysDictType.findUnique({
      where: { code },
      include: { data: { where: { status: 1 }, orderBy: [{ sort: 'asc' }] } },
    })
    return dictType?.data || []
  },
}
