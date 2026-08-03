import type { ActiveProgram, Workout } from './types'
import { addLocalDays, toLocalDateStr, weekdayOf } from './dates'

export type CalendarDayStatus = 'rest' | 'scheduled' | 'done' | 'done-scheduled'

export interface CalendarDay {
  date: string
  status: CalendarDayStatus
  routineDayIndex: number | null
}

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

export const buildMonthGrid = (
  year: number,
  month: number,
  trained: Set<string>,
  program: ActiveProgram | null,
  daysCount: number
): CalendarDay[] => {
  const first = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const result: CalendarDay[] = []

  for (let d = 1; d <= daysInMonth; d++) {
    const date = toLocalDateStr(new Date(year, month, d))
    const done = trained.has(date)
    let routineDayIndex: number | null = null
    let scheduled = false
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
    result.push({ date, status, routineDayIndex })
  }

  // pad leading blanks for week start Monday-style optional — keep Sunday-first JS
  void first
  return result
}

export const estimateWorkoutMinutes = (
  items: { targetSets: number; restSec: number }[],
  secondsPerSet = 45
): number => {
  const totalSec = items.reduce((acc, it) => acc + it.targetSets * (secondsPerSet + it.restSec), 0)
  return Math.max(1, Math.round(totalSec / 60))
}

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
