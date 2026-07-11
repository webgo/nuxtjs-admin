export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    globalThis.$fetch = globalThis.$fetch.create({
      onResponseError({ response }) {
        if (response.status === 401) {
          const path = window.location.pathname
          if (path.startsWith('/portal')) {
            const portalToken = useCookie('portal_token')
            portalToken.value = null
            navigateTo('/portal/login')
          } else {
            const adminToken = useCookie('admin_token')
            adminToken.value = null
            ElMessage.error('登录已失效，请重新登录')
            navigateTo('/admin/login')
          }
        }
      },
    })
  }
})
