// Utilidades de fechas en horario local (formato YYYY-MM-DD), sin depender de la zona horaria UTC.
const pad = (n: number) => String(n).padStart(2, '0')

// Formatea una fecha en local; usar local (no toISOString) evita cambios de día por la zona horaria.
export const toLocalDateStr = (date: Date = new Date()): string => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// Fecha local de un entreno, priorizando el campo localDate sobre el timestamp de inicio.
export const localDateOf = (w: { localDate?: string; startedAt: string }): string =>
  w.localDate ?? toLocalDateStr(new Date(w.startedAt))

// Parsea YYYY-MM-DD como fecha local para que sumas y diferencias no crucen días por UTC.
export const parseLocalDate = (dateStr: string): Date => {
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Días enteros entre dos fechas locales (positivo si b es posterior a a).
export const diffLocalDays = (a: string, b: string): number => {
  const dA = parseLocalDate(a)
  const dB = parseLocalDate(b)
  return Math.round((dB.getTime() - dA.getTime()) / 86_400_000)
}

// Suma días a una fecha local respetando el calendario (meses y años bisiestos).
export const addLocalDays = (dateStr: string, days: number): string => {
  const d = parseLocalDate(dateStr)
  d.setDate(d.getDate() + days)
  return toLocalDateStr(d)
}

/** 0 = Sunday … 6 = Saturday (JS) */
export const weekdayOf = (dateStr: string): number => parseLocalDate(dateStr).getDay()

// Clave de la semana (lunes como inicio) que contiene una fecha local, para agrupar entrenos por semana.
export const weekStartKey = (dateStr: string): string => {
  const d = new Date(dateStr + 'T12:00:00')
  const mondayOffset = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - mondayOffset)
  return toLocalDateStr(d)
}

// Rango de fechas usado por los gráficos de estadísticas; `0` significa sin límite.
export type StatsRange = 30 | 90 | 0

// Devuelve true si la fecha local cae dentro de los últimos `range` días; `0` significa sin límite.
export const inRange = (localDate: string, range: StatsRange, now: number = Date.now()): boolean => {
  if (range === 0) return true
  return new Date(localDate + 'T12:00:00').getTime() >= now - range * 86_400_000
}
