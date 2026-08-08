// Lógica de la semana de descarga (deload) del programa activo.
import { toLocalDateStr } from './dates'

export const DELOAD_WEEK_DAYS = 7

// Fecha de fin de la deload: hoy + 7 días.
export const deloadUntilDate = (): string => {
  const d = new Date()
  d.setDate(d.getDate() + DELOAD_WEEK_DAYS)
  return toLocalDateStr(d)
}

// La deload está activa si está marcada y la fecha límite aún no ha pasado; sin fecha, se considera indefinida.
export const isDeloadActive = (
  active: boolean | undefined,
  until: string | null | undefined
): boolean => {
  if (!active) return false
  if (!until) return true
  return new Date(`${until}T23:59:59`).getTime() >= Date.now()
}
