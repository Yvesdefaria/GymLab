import { toLocalDateStr } from './dates'

export const DELOAD_WEEK_DAYS = 7

export const deloadUntilDate = (): string => {
  const d = new Date()
  d.setDate(d.getDate() + DELOAD_WEEK_DAYS)
  return toLocalDateStr(d)
}

export const isDeloadActive = (
  active: boolean | undefined,
  until: string | null | undefined
): boolean => {
  if (!active) return false
  if (!until) return true
  return new Date(`${until}T23:59:59`).getTime() >= Date.now()
}
