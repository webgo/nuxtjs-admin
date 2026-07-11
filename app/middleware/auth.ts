export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie('admin_token')

  if (to.path === '/admin/login') {
    if (token.value) {
      return navigateTo('/admin')
    }
    return
  }

  if (!token.value) {
    return navigateTo('/admin/login')
  }
})
