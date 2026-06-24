import ExcelJS from 'exceljs'
import type { ApiResponse, PaginatedData } from '#shared/types/api'

export interface ExportColumn {
  key: string
  title: string
  width?: number
  /** 值格式化函数 */
  formatter?: (value: unknown, row: Record<string, unknown>) => string
}

export interface ExportOptions<T = Record<string, unknown>> {
  columns: ExportColumn[]
  /** 获取全部数据（非分页） */
  fetchData: () => Promise<ApiResponse<T[] | PaginatedData<T>>>
  fileName?: string
  sheetName?: string
}

/**
 * 数据导出 composable
 *
 * @example
 * ```ts
 * const { exporting, exportExcel } = useExport()
 * await exportExcel({
 *   columns: [
 *     { key: 'username', title: '用户名', width: 20 },
 *     { key: 'status', title: '状态', formatter: v => v === 1 ? '启用' : '禁用' },
 *   ],
 *   fetchData: () => $fetch('/api/system/user?pageSize=9999'),
 *   fileName: '用户数据.xlsx',
 * })
 * ```
 */
export function useExport() {
  const exporting = ref(false)

  async function exportExcel<T = Record<string, unknown>>(options: ExportOptions<T>): Promise<void> {
    const { columns, fetchData, fileName = 'export.xlsx', sheetName = 'Sheet1' } = options
    exporting.value = true

    try {
      const res = await fetchData()
      // 支持分页和非分页响应
      const rawData = res.data
      const data: Record<string, unknown>[] = Array.isArray(rawData)
        ? rawData as Record<string, unknown>[]
        : ((rawData as PaginatedData<unknown>).list || []).map(r => r as Record<string, unknown>)

      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet(sheetName)

      sheet.columns = columns.map(col => ({
        header: col.title,
        key: col.key,
        width: col.width || 20,
      }))

      data.forEach(row => {
        const flatRow: Record<string, unknown> = {}
        for (const col of columns) {
          const value = row[col.key]
          flatRow[col.key] = col.formatter ? col.formatter(value, row) : (value ?? '')
        }
        sheet.addRow(flatRow)
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('[Export] failed:', err)
      ElMessage.error('导出失败')
    } finally {
      exporting.value = false
    }
  }

  return { exporting, exportExcel }
}
