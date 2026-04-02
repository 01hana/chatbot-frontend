// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@vueuse/nuxt',
    '@pinia/nuxt',
    '@nuxt/ui',
    '@nuxt/icon',
    '@nuxt/fonts',
    '@nuxt/image',
    'nuxt-security',
    '@vee-validate/nuxt',
    '@nuxtjs/i18n',
    '@nuxt/test-utils/module',
  ],
  security: {
    headers: {
      contentSecurityPolicy: {
        'img-src': [
          "'self'",
          'data:',
          'blob:',
          'https://img.freepik.com',
          'https://vxeui.com',
          'https://picsum.photos',
          'https://fastly.picsum.photos',
          'https://images.unsplash.com',
        ],
      },
    },
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      API_URL: process.env.NUXT_API_URL,
    },
  },
  // auth: {
  //   origin: process.env.ORIGIN || 'http://localhost:3000',
  //   enableGlobalAppMiddleware: true,
  //   baseURL: process.env.API_URL || 'http://localhost:3000/api',
  //   provider: {
  //     type: 'local',
  //     endpoints: {
  //       login: { path: '/auth/login', method: 'post' },
  //     },
  //   },
  // },
  app: {
    baseURL: '/',
    viewTransition: true,
  },
  i18n: {
    defaultLocale: 'zh-TW',
    strategy: 'no_prefix',
    langDir: 'locales',
    locales: [
      {
        code: 'zh-TW',
        files: ['zh-TW/common.json', 'zh-TW/plugin.json'],
      },
      {
        code: 'en',
        files: ['en/common.json', 'en/plugin.json'],
      },
    ],
  },
  veeValidate: {
    autoImports: true,
  },
  imports: {
    dirs: ['stores', 'composables', 'utils', 'libs/vxe-table'],
  },
  vite: {
    optimizeDeps: {
      include: ['@vue/devtools-core', '@vue/devtools-kit', '@vee-validate/i18n', 'gsap'],
    },
  },
  ssr: false,
});
