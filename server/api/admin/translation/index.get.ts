import { translationService } from '../../../services/translation.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const locale = query.locale as string | undefined
  const page = query.page ? Number(query.page) : undefined

  if (page) {
    return {
      code: 200,
      data: await translationService.listFlat({
        page,
        pageSize: Number(query.pageSize) || 20,
        keyword: query.keyword as string | undefined,
        keySearch: query.keySearch as string | undefined,
        namespace: query.namespace as string | undefined,
      }),
    }
  }

  return { code: 200, data: await translationService.listByLocale(locale) }
})
