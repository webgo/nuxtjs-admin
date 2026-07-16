<template>
  <UApp :toaster="{ position: 'top-right' }">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup lang="ts">
const adminToken = useCookie('admin_token')
const portalToken = useCookie('portal_token')

onMounted(async () => {
  if (adminToken.value) {
    const authStore = useAuthStore()
    await authStore.fetchUserInfo()
    await authStore.fetchMenus()
  }
  if (portalToken.value) {
    const portalAuth = usePortalAuthStore()
    await portalAuth.fetchUserInfo()
  }
})
</script>
