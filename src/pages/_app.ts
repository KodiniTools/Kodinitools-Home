import type { App } from 'vue'
import { createI18n } from 'vue-i18n'
import de from '../locales/de.json'
import en from '../locales/en.json'

// SSR-safe locale detection
const getDefaultLocale = () => {
  if (typeof window === 'undefined') {
    return 'de'
  }
  const savedLocale = localStorage.getItem('locale')
  const browserLocale = navigator.language.split('-')[0]
  return savedLocale || (browserLocale === 'en' ? 'en' : 'de')
}

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: getDefaultLocale(),
  fallbackLocale: 'de',
  messages: { de, en }
})

export default (app: App) => {
  app.use(i18n)
}
