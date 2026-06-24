export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie('token')

  // 登录页不需要认证
  if (to.path === '/login') {
    if (token.value) {
      return navigateTo('/')
    }
    return
  }

  // 其他页面需要登录
  if (!token.value) {
    return navigateTo('/login')
  }
})
