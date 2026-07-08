// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@element-plus/nuxt', '@pinia/nuxt'],

  elementPlus: {
    icon: 'ElIcon',
    importStyle: 'scss',
  },

  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'nuxtjs-admin-secret-key-2024',
    jwtExpiresIn: '24h',
  },

  css: ['element-plus/dist/index.css', '~/assets/css/global.css'],

  typescript: {
    strict: true,
  },

  nitro: {
    storage: {
      redis: process.env.REDIS_URL
        ? { driver: 'redis', url: process.env.REDIS_URL, base: 'nuxtjsadmin' }
        : { driver: 'fs', base: './.data/app_cache' },
    },
  },

  app: {
    head: {
      title: 'FoodDelivery - 美食外送',
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
    },
  },

  routeRules: {
    '/': { redirect: '/portal' },
    '/portal/**': { ssr: true },
  },
})
