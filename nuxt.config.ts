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
    jwtSecret: process.env.JWT_SECRET || 'admin-app-secret-key-2024',
    jwtExpiresIn: '24h',
  },

  css: ['element-plus/dist/index.css'],

  typescript: {
    strict: true,
  },

  nitro: {},

  app: {
    head: {
      title: 'Admin App',
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
    },
  },
})
