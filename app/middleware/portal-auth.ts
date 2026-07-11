export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie('portal_token')

  if (to.path === '/portal/login' || to.path === '/portal/register') {
    if (token.value) {
      return navigateTo('/portal')
    }
  }
})
