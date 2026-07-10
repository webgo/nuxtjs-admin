import type { ApiResponse, FileRecord } from '#shared/types/api'

export function useFileHelper() {
  /**
   * 上传单个文件
   * @param file  File 对象（来自 <input type="file"> 或 el-upload）
   * @param extra 额外的表单字段（如 module 归属模块名）
   */
  async function uploadFile(file: File, extra?: Record<string, any>) {
    const formData = new FormData()
    formData.append('file', file)

    if (extra) {
      for (const [key, value] of Object.entries(extra)) {
        formData.append(key, String(value))
      }
    }

    const res = await $fetch<ApiResponse<FileRecord>>('/api/system/file/upload', {
      method: 'POST',
      body: formData,
    })
    return res.data
  }

  /**
   * 批量上传文件
   */
  async function uploadFiles(files: File[], extra?: Record<string, any>) {
    const formData = new FormData()
    for (const file of files) {
      formData.append('files', file)
    }
    if (extra) {
      for (const [key, value] of Object.entries(extra)) {
        formData.append(key, String(value))
      }
    }
    const res = await $fetch<ApiResponse<FileRecord[]>>('/api/system/file/upload', {
      method: 'POST',
      body: formData,
    })
    return res.data ?? []
  }

  /** 获取文件的完整可访问 URL */
  function getFileUrl(filePath: string): string {
    if (!filePath) return ''
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath
    }
    return filePath
  }

  /** 格式化文件大小 */
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB']
    const k = 1024
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i]
  }

  /** 根据 MIME type 获取文件类型标签色 */
  function getFileTypeTag(fileType: string): string {
    if (!fileType) return 'info'
    if (fileType.startsWith('image/')) return 'success'
    if (fileType.startsWith('video/')) return 'warning'
    if (fileType.startsWith('audio/')) return 'danger'
    if (fileType.includes('pdf')) return 'danger'
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('tar')) return ''
    if (fileType.includes('word') || fileType.includes('document')) return 'primary'
    if (fileType.includes('excel') || fileType.includes('sheet')) return 'success'
    return 'info'
  }

  return {
    uploadFile,
    uploadFiles,
    getFileUrl,
    formatFileSize,
    getFileTypeTag,
  }
}
