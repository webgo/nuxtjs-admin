import type { ApiResponse } from '#shared/types/api'

interface UseRequestOptions {
  /** 是否显示错误消息 (默认 true) */
  showError?: boolean
  /** 自定义错误处理 */
  onError?: (err: { code: number; message: string }) => void
}

interface RequestConfig extends UseRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: Record<string, unknown> | FormData
  params?: Record<string, unknown>
  headers?: Record<string, string>
}

/**
 * 统一 API 请求封装
 *
 * - 自动携带 token
 * - 统一错误处理
 * - loading / error 状态管理
 * - 完整泛型支持
 *
 * @example
 * ```ts
 * const { get, post, loading } = useRequest()
 * const data = await get<UserItem[]>('/api/system/user', { params: { page: 1 } })
 * ```
 */
export function useRequest() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function request<T = unknown>(url: string, config: RequestConfig = {}): Promise<T | null> {
    const { showError = true, onError, method = 'GET', body, params, headers } = config
    loading.value = true
    error.value = null

    try {
      const res = await $fetch(url, {
        method,
        body,
        params,
        headers,
      }) as unknown as ApiResponse<T>

      if (res.code !== 200) {
        const msg = res.msg || '请求失败'
        if (showError) ElMessage.error(msg)
        error.value = msg
        onError?.({ code: res.code, message: msg })
        return null
      }

      return res.data ?? (res as unknown as T)
    } catch (err: unknown) {
      const e = err as { data?: { message?: string }; message?: string; statusCode?: number }
      const msg = e.data?.message || e.message || '网络错误'
      if (showError) ElMessage.error(msg)
      error.value = msg
      onError?.({ code: e.statusCode || 500, message: msg })
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    /** 加载状态 */
    loading,
    /** 错误信息 */
    error,
    /** GET 请求 */
    get: <T>(url: string, opts?: { params?: Record<string, unknown> } & UseRequestOptions) =>
      request<T>(url, { ...opts, method: 'GET' }),
    /** POST 请求 */
    post: <T>(url: string, body?: Record<string, unknown> | FormData, opts?: UseRequestOptions) =>
      request<T>(url, { ...opts, method: 'POST', body }),
    /** PUT 请求 */
    put: <T>(url: string, body?: Record<string, unknown>, opts?: UseRequestOptions) =>
      request<T>(url, { ...opts, method: 'PUT', body }),
    /** DELETE 请求 */
    del: <T>(url: string, opts?: UseRequestOptions) =>
      request<T>(url, { ...opts, method: 'DELETE' }),
  }
}
