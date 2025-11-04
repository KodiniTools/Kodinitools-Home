import { ViteSSG } from 'vite-ssg/single-page'
import App from './App.vue'
import i18n from './i18n'

// ViteSSG export for static site generation (single page, no router)
export const createApp = ViteSSG(
  App,
  ({ app }) => {
    app.use(i18n)
  }
)
