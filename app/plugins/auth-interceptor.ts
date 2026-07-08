export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    globalThis.$fetch = globalThis.$fetch.create({
      onResponseError({ response }) {
        if (response.status === 401) {
          const token = useCookie('token')
          token.value = null
          ElMessage.error('登录已失效，请重新登录')
          navigateTo('/admin/login')
        }
      },
    })
  }
})
