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

// Etiqueta corta de fecha para gráficos (día y mes localizados, sin año); mediodía evita desfases de zona.
export const formatDayShort = (dateStr: string, lang: AppLanguage): string =>
  formatDate(dateStr + 'T12:00:00', lang, { day: 'numeric', month: 'short' })

// Duración en minutos → «1 h 02 min» / «45 min». El formato es igual en es/en.
export const formatDurationMinutes = (minutes: number): string => {
  const safe = Math.max(0, Math.round(minutes))
  const hours = Math.floor(safe / 60)
  const rest = safe % 60
  return hours > 0 ? `${hours} h ${String(rest).padStart(2, '0')} min` : `${rest} min`
}

// Pasos: separador de miles también en 4 cifras (7.000), a diferencia del
// formato es-ES general que no agrupa 4 dígitos. En inglés se usa en-GB.
export const formatStepNumber = (n: number, lang: AppLanguage): string =>
  new Intl.NumberFormat(lang === 'en' ? 'en-GB' : 'es-AR').format(n)

// Iniciales de mes para el eje del gráfico anual (E F M A M J J A S O N D).
export const monthLetters = (lang: AppLanguage): string[] => {
  const base = new Intl.DateTimeFormat(localeFor(lang), { month: 'narrow' })
  return Array.from({ length: 12 }, (_, month) =>
    base.format(new Date(2024, month, 1)).toUpperCase(),
  )
}

// Iniciales de los días de la semana para las grillas de calendario; `startDay`
// 0 = domingo (getDay()), 1 = lunes (semana europea).
export const weekdayLetters = (lang: AppLanguage, startDay: 0 | 1 = 1): string[] => {
  const base = new Intl.DateTimeFormat(localeFor(lang), { weekday: 'narrow' })
  const letters = Array.from({ length: 7 }, (_, i) =>
    base.format(new Date(2024, 0, 1 + i)).toUpperCase()
  )
  return startDay === 1 ? letters : [...letters.slice(6), ...letters.slice(0, 6)]
}
