// Configuración de i18next (react-i18next): es-ES por defecto, sin detección
// automática (el idioma lo decide el usuario desde Ajustes/onboarding).
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { AppLanguage } from '@/domain/onboarding'
import type { EsSchema } from './locales/es'
import { en } from './locales/en'
import { es } from './locales/es'

export const APP_LOCALES: AppLanguage[] = ['es', 'en']

// Las claves fuertes vienen de `es` (fuente única); `t()` queda tipado contra ella.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: { translation: EsSchema }
  }
}

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
  },
  lng: 'es',
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
  initAsync: false,
  react: { useSuspense: false },
})

// Aplica un idioma de verdad: instancia i18n, <html lang> y título base por idioma.
export const applyLanguage = async (lang: AppLanguage): Promise<void> => {
  document.documentElement.lang = lang
  await i18n.changeLanguage(lang)
  document.title = i18n.t('seo.titleDefault')
}

export { i18n }
