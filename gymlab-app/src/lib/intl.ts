// Formateo localizado de fechas, números y volumen con Intl según el idioma.
import type { AppLanguage } from '@/domain/onboarding'

const localeFor = (lang: AppLanguage): string => (lang === 'en' ? 'en-GB' : 'es-ES')

const toDate = (date: Date | string): Date => (typeof date === 'string' ? new Date(date) : date)

export const formatDate = (
  date: Date | string,
  lang: AppLanguage,
  opts?: Intl.DateTimeFormatOptions,
): string => new Intl.DateTimeFormat(localeFor(lang), opts).format(toDate(date))

export const formatNumber = (
  n: number,
  lang: AppLanguage,
  opts?: Intl.NumberFormatOptions,
): string => new Intl.NumberFormat(localeFor(lang), opts).format(n)

// Volumen en kg: desde 1000 se muestra como «k» con 1 decimal (coherente con el resto de la app).
export const formatVolume = (kg: number, lang: AppLanguage): string =>
  kg >= 1000
    ? `${formatNumber(kg / 1000, lang, { maximumFractionDigits: 1 })}k`
    : formatNumber(kg, lang, { maximumFractionDigits: 0 })
