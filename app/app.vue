<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const token = useCookie('token')

// 只在客户端初始化 auth 状态（SSR 时 $fetch 不会自动转发 cookie）
onMounted(async () => {
  if (token.value) {
    const authStore = useAuthStore()
    await authStore.fetchUserInfo()
    await authStore.fetchMenus()
  }
})
</script>
