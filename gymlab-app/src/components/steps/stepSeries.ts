// Moldes puros de datos del dashboard de pasos (F84b): convierten los registros
// del hook en series listas para los gráficos. Sin React ni i18n: las etiquetas
// de los días se pasan desde la UI (weekdayLetters de lib/intl).
import type { DailyStepsEntry } from '@/domain/types'
import { addLocalDays, diffLocalDays, weekStartKey } from '@/domain/dates'

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

export type StepHeatLevel = 0 | 1 | 2 | 3 | 4

export type HeatCell = {
  date: string
  steps: number
  level: StepHeatLevel
  inMonth: boolean
}

// Grilla semanal del mes (7 columnas × 5 o 6 filas según el mes): arranca el
// lunes de la semana del día 1 y crece a 6 filas cuando el mes no cabe en 35
// celdas (31 días empezando viernes, sábado o domingo). Las celdas de cabecera
// y cola que caen fuera del mes se marcan vacías para que la UI no las pinte.
export const buildHeatmapGrid = (
  monthKey: string,
  entries: DailyStepsEntry[],
  heatmap: Record<string, StepHeatLevel>,
): HeatCell[] => {
  const stepsByDate = new Map(entries.map((e) => [e.localDate, e.steps]))
  const start = weekStartKey(`${monthKey}-01`)
  const [year, month] = monthKey.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()
  const leading = diffLocalDays(start, `${monthKey}-01`)
  const size = Math.ceil((leading + daysInMonth) / 7) * 7

  return Array.from({ length: size }, (_, i) => {
    const date = addLocalDays(start, i)
    const inMonth = date.startsWith(monthKey)
    return {
      date,
      // Fuera del mes la celda va vacía: los pasos/color solo se muestran in-month.
      steps: inMonth ? stepsByDate.get(date) ?? 0 : 0,
      level: inMonth ? (heatmap[date] ?? 0) : 0,
      inMonth,
    }
  })
}