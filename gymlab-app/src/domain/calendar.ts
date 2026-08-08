// Construcción de rejillas de calendario, progreso del programa activo y estimación de duración de sesiones.
import type { ActiveProgram, Workout } from './types'
import { addLocalDays, toLocalDateStr, weekdayOf } from './dates'

export type CalendarDayStatus = 'rest' | 'scheduled' | 'done' | 'done-scheduled'

export interface CalendarDay {
  date: string
  status: CalendarDayStatus
  routineDayIndex: number | null
}

// Fechas locales (YYYY-MM-DD) con entrenamiento realizado, para marcar días completados en el calendario.
export const trainedLocalDates = (workouts: Pick<Workout, 'localDate' | 'startedAt' | 'finishedAt'>[]): Set<string> => {
  const set = new Set<string>()
  for (const w of workouts) {
    if (w.localDate) set.add(w.localDate.slice(0, 10))
    else if (w.finishedAt) set.add(toLocalDateStr(new Date(w.finishedAt)))
    else if (w.startedAt) set.add(toLocalDateStr(new Date(w.startedAt)))
  }
  return set
}

/** Maps calendar weekday → next routine dayIndex in cycle based on program.weekdays order */
export const scheduledDayIndex = (program: ActiveProgram, dateStr: string): number | null => {
  const wd = weekdayOf(dateStr)
  const pos = program.weekdays.indexOf(wd)
  if (pos < 0) return null
  return pos
}

const buildCalendarDay = (
  date: string,
  trained: Set<string>,
  program: ActiveProgram | null,
  daysCount: number
): CalendarDay => {
  const done = trained.has(date)
  let routineDayIndex: number | null = null
  let scheduled = false
  // Un día está planificado si el programa asigna rutina a ese día de la semana.
  if (program && daysCount > 0) {
    const pos = scheduledDayIndex(program, date)
    if (pos !== null) {
      scheduled = true
      routineDayIndex = pos % daysCount
    }
  }
  let status: CalendarDayStatus = 'rest'
  if (done && scheduled) status = 'done-scheduled'
  else if (done) status = 'done'
  else if (scheduled) status = 'scheduled'
  return { date, status, routineDayIndex }
}

export const buildMonthGrid = (
  year: number,
  month: number,
  trained: Set<string>,
  program: ActiveProgram | null,
  daysCount: number
): CalendarDay[] => {
  // Rejilla de un mes completo (del día 1 al último día del mes).
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const result: CalendarDay[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    result.push(
      buildCalendarDay(toLocalDateStr(new Date(year, month, d)), trained, program, daysCount)
    )
  }
  return result
}

/** Week from Monday to Sunday (semana vigente) containing the anchor date. */
export const buildWeekGrid = (
  anchor: Date,
  trained: Set<string>,
  program: ActiveProgram | null,
  daysCount: number
): CalendarDay[] => {
  const monday = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate())
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  const result: CalendarDay[] = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    result.push(buildCalendarDay(toLocalDateStr(date), trained, program, daysCount))
  }
  return result
}

// Estimación en minutos: tiempo de series (set + descanso) más un margen por cambio de ejercicio.
export const estimateWorkoutMinutes = (
  items: { targetSets: number; restSec: number }[],
  secondsPerSet = 45
): number => {
  const totalSets = items.reduce((acc, it) => acc + it.targetSets, 0)
  const totalSec = items.reduce((acc, it) => acc + it.targetSets * (secondsPerSet + it.restSec), 0)
  return Math.max(1, Math.round(totalSec / 60) + totalSets)
}

// % de días planificados del programa completados desde su inicio, limitado a una ventana reciente.
export const programProgressPct = (
  trainedDates: string[],
  program: ActiveProgram | null,
  daysCount: number,
  windowDays = 28
): number => {
  if (!program || daysCount <= 0) return 0
  const start = program.startDate
  const end = toLocalDateStr()
  const trained = new Set(trainedDates)
  let scheduled = 0
  let done = 0
  let cursor = start
  let guard = 0
  // Guard para no recorrer siglos de calendario si el programa es muy antiguo.
  while (cursor <= end && guard < windowDays * 2) {
    if (scheduledDayIndex(program, cursor) !== null) {
      scheduled++
      if (trained.has(cursor)) done++
    }
    cursor = addLocalDays(cursor, 1)
    guard++
    if (guard > 400) break
  }
  if (scheduled === 0) return 0
  return Math.min(100, Math.round((done / scheduled) * 100))
}
