// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@element-plus/nuxt', '@pinia/nuxt', '@nuxt/ui', '@nuxtjs/i18n'],

  elementPlus: {
    icon: 'ElIcon',
    importStyle: 'scss',
  },

  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'nuxtjs-admin-secret-key-2024',
    jwtExpiresIn: '24h',
  },

  css: ['element-plus/dist/index.css', '~/assets/css/global.css', '~/assets/css/main.css'],

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

  i18n: {
    defaultLocale: 'tw',
    locales: [
      { code: 'tw', name: '中文', file: 'tw.json' },
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'jp', name: '日本語', file: 'jp.json' },
    ],
    strategy: 'no_prefix',
    detectBrowserLanguage: false,
  },

  fonts: {
    providers: {
      google: false,
      googleicons: false,
      adobe: false,
      bunny: false,
      fontshare: false,
      fontsource: false,
    },
  },
})
