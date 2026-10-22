// Configuración de i18next (react-i18next): sin detección automática. El idioma
// efectivo lo aplica el arranque (settings.language o el default del producto,
// inglés) antes del primer paint; 'es' acá es solo el valor interno de partida.
// El locale EN se carga lazy la primera vez que se aplica.
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { AppLanguage } from '@/domain/onboarding'
import type { EsSchema } from './locales/es'
import { es } from './locales/es'

export const APP_LOCALES: AppLanguage[] = ['es', 'en']

// Clave i18n válida (dot-path) para tipar arrays/records de claves dinámicas que
// luego se pasan a t(): obliga a que sean literales del esquema, no `string`.
export type I18nKey = import('i18next').ParseKeys

// Las claves fuertes vienen de `es` (fuente única); `t()` queda tipado contra ella.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: { translation: EsSchema }
  }
}

// Carga lazy del locale EN: solo se importa cuando el usuario cambia a inglés.
const enBundle = () => import('./locales/en').then((m) => m.en)

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
  },
  lng: 'es',
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
  initAsync: false,
  react: { useSuspense: false },
})

// Aplica un idioma de verdad: instancia i18n, <html lang> y título base por idioma.
// Para EN, carga el bundle dinámico antes de cambiar.
export const applyLanguage = async (lang: AppLanguage): Promise<void> => {
  if (lang === 'en' && !i18n.hasResourceBundle('en', 'translation')) {
    const en = await enBundle()
    i18n.addResourceBundle('en', 'translation', en)
  }
  document.documentElement.lang = lang
  await i18n.changeLanguage(lang)
  document.title = i18n.t('seo.titleDefault')
}

export { i18n }
