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

// Iniciales de los días de la semana para las grillas de calendario; `startDay`
// 0 = domingo (getDay()), 1 = lunes (semana europea).
export const weekdayLetters = (lang: AppLanguage, startDay: 0 | 1 = 1): string[] => {
  const base = new Intl.DateTimeFormat(localeFor(lang), { weekday: 'narrow' })
  const letters = Array.from({ length: 7 }, (_, i) =>
    base.format(new Date(2024, 0, 1 + i)).toUpperCase()
  )
  return startDay === 1 ? letters : [...letters.slice(6), ...letters.slice(0, 6)]
}
