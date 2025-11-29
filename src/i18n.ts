import { createI18n } from 'vue-i18n'
import de from './locales/de.json'
import en from './locales/en.json'

// SSR-safe locale detection
const getDefaultLocale = () => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return 'de' // Default locale for SSR
  }

  // Get saved locale or detect browser language
  const savedLocale = localStorage.getItem('locale')
  const browserLocale = navigator.language.split('-')[0]
  return savedLocale || (browserLocale === 'en' ? 'en' : 'de')
}

export const i18n = createI18n({
  legacy: false, // Use Composition API
  globalInjection: true, // Enable global $t
  locale: getDefaultLocale(),
  fallbackLocale: 'de',
  messages: {
    de,
    en
  }
})

export default i18n
