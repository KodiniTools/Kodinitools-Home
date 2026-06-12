import { defineConfig } from 'astro/config'
import vue from '@astrojs/vue'
import sitemap from '@astrojs/sitemap'

export default defineConfig({
  site: 'https://kodinitools.com',
  base: '/',
  integrations: [
    vue({
      appEntrypoint: '/src/pages/_app',
    }),
    sitemap({
      i18n: {
        defaultLocale: 'de',
        locales: {
          de: 'de-CH',
          en: 'en-US',
        },
      },
    }),
  ],
  vite: {
    define: {
      __VUE_PROD_DEVTOOLS__: JSON.stringify(false),
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false)
    },
    ssr: {
      noExternal: ['vue-i18n']
    }
  }
})
