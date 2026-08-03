const pad = (n: number) => String(n).padStart(2, '0')

export const toLocalDateStr = (date: Date = new Date()): string => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export const parseLocalDate = (dateStr: string): Date => {
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const diffLocalDays = (a: string, b: string): number => {
  const dA = parseLocalDate(a)
  const dB = parseLocalDate(b)
  return Math.round((dB.getTime() - dA.getTime()) / 86_400_000)
}

export const addLocalDays = (dateStr: string, days: number): string => {
  const d = parseLocalDate(dateStr)
  d.setDate(d.getDate() + days)
  return toLocalDateStr(d)
}

/** 0 = Sunday … 6 = Saturday (JS) */
export const weekdayOf = (dateStr: string): number => parseLocalDate(dateStr).getDay()
