<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
onMounted(() => navigateTo('/admin/monitor/server', { replace: true }))
</script>

<template>
  <div />
</template>
