import type { DictDataItem, TagType, DictOption } from '#shared/types/api'

/**
 * 字典工具 composable
 *
 * 提供按字典标识批量获取字典数据的能力，常用于下拉选项、标签显示等场景。
 *
 * @example
 * ```ts
 * const { getDict, getDictLabel, dictMap } = useDict()
 * // 获取字典选项列表
 * const statusOptions = await getDict('sys_normal_disable')
 * // 获取单个字典标签名
 * const label = getDictLabel(dictMap.value.sys_normal_disable, 1)
 * ```
 */

/** 缓存 key 过期时间（毫秒） */
const CACHE_TTL = 5 * 60 * 1000

interface CacheEntry {
  data: DictDataItem[]
  timestamp: number
}

const dictCache = new Map<string, CacheEntry>()

/**
 * 将 DictDataItem 的 cssClass 映射为 el-tag 的 type
 */
function cssClassToTagType(cssClass?: string): TagType {
  const valid: TagType[] = ['success', 'warning', 'danger', 'info', 'primary']
  return cssClass && valid.includes(cssClass as TagType) ? (cssClass as TagType) : 'info'
}

export function useDict() {
  /**
   * 按字典标识获取字典数据列表（带内存缓存）
   */
  async function getDict(dictCode: string): Promise<DictDataItem[]> {
    const cached = dictCache.get(dictCode)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data
    }

    const res = await $fetch<{ code: number; data: { list: DictDataItem[] } }>('/api/admin/dict-data', {
      params: { dictCode, pageSize: 999 },
    })

    const list = res.data?.list ?? []
    dictCache.set(dictCode, { data: list, timestamp: Date.now() })
    return list
  }

  /**
   * 获取字典选项列表（含标签颜色），适用于 el-select / el-radio-group 等组件
   *
   * @param dictCode 字典标识
   * @param filter 可选过滤函数，如 (item) => item.status === 1 只取启用的
   */
  async function getDictOptions(dictCode: string, filter?: (item: DictDataItem) => boolean): Promise<DictOption[]> {
    const list = await getDict(dictCode)
    const items = filter ? list.filter(filter) : list
    return items.map(item => ({
      value: item.value,
      label: item.label,
      tagType: cssClassToTagType(item.cssClass),
      cssClass: item.cssClass,
    }))
  }

  /**
   * 根据字典值和字典数据列表获取对应的标签名
   */
  function getDictLabel(list: DictDataItem[], value: string | number): string {
    const found = list.find(item => item.value === String(value))
    return found?.label ?? String(value)
  }

  /**
   * 根据字典值和字典数据列表获取对应的 el-tag type
   */
  function getDictTagType(list: DictDataItem[], value: string | number): TagType {
    const found = list.find(item => item.value === String(value))
    return cssClassToTagType(found?.cssClass)
  }

  /**
   * 批量获取多个字典数据，结果缓存在 dictMap 的 reactive 对象中
   *
   * @example
   * ```ts
   * const { dictMap, loadDicts } = useDict()
   * await loadDicts(['sys_normal_disable', 'sys_user_sex'])
   * // dictMap.value.sys_normal_disable 即为 DictDataItem[]
   * ```
   */
  const dictMap = ref<Record<string, DictDataItem[]>>({})

  async function loadDicts(codes: string[]) {
    const entries = await Promise.all(codes.map(async (code) => {
      const list = await getDict(code)
      return [code, list] as const
    }))
    dictMap.value = Object.fromEntries(entries)
  }

  /** 清除字典缓存 */
  function clearDictCache() {
    dictCache.clear()
  }

  return {
    getDict,
    getDictOptions,
    getDictLabel,
    getDictTagType,
    dictMap,
    loadDicts,
    clearDictCache,
  }
}
