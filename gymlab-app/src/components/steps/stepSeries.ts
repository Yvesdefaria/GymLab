// Moldes puros de datos del dashboard de pasos (F84b): convierten los registros
// del hook en series listas para los gráficos. Sin React ni i18n: las etiquetas
// de los días se pasan desde la UI (weekdayLetters de lib/intl).
import type { DailyStepsEntry } from '@/domain/types'
import { addLocalDays, weekStartKey } from '@/domain/dates'

export type WeekPoint = {
  date: string
  label: string
  steps: number
  isToday: boolean
}

// Serie de 7 puntos (lunes→domingo) de la semana que contiene `today`; los días
// sin registro suman 0 y los que caen fuera de la semana se ignoran.
export const buildWeekSeries = (
  entries: DailyStepsEntry[],
  today: string,
  dayLabels: string[],
): WeekPoint[] => {
  const stepsByDate = new Map(entries.map((e) => [e.localDate, e.steps]))
  const start = weekStartKey(today)

  return Array.from({ length: 7 }, (_, i) => {
    const date = addLocalDays(start, i)
    return {
      date,
      label: dayLabels[i] ?? '',
      steps: stepsByDate.get(date) ?? 0,
      isToday: date === today,
    }
  })
}