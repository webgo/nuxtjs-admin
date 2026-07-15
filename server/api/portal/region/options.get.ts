import { regionService } from '../../../services/region.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const level = query.level !== undefined ? Number(query.level) : undefined
  const parentId = query.parentId !== undefined ? Number(query.parentId) : undefined
  const status = query.status !== undefined ? Number(query.status) : 1

  const rows = await regionService.list({ page: 1, pageSize: 1000, level, status })
  const list = rows.list.filter(r => {
    if (parentId !== undefined && r.parentId !== parentId) return false
    return true
  }).map(r => ({
    id: r.id, name: r.name, nameEn: r.nameEn, nameJp: r.nameJp,
    level: r.level, parentId: r.parentId, lng: r.lng, lat: r.lat,
  }))

  return { code: 200, data: list }
})
