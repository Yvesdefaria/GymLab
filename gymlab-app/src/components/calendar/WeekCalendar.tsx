import { useMemo } from 'react'
import { buildWeekGrid } from '@/domain/calendar'
import { toLocalDateStr } from '@/domain/dates'
import type { ActiveProgram } from '@/domain/types'

export interface WeekCalendarProps {
  trained: Set<string>
  program: ActiveProgram | null
  routineDaysCount: number
}

const WEEKDAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export const WeekCalendar = ({ trained, program, routineDaysCount }: WeekCalendarProps) => {
  const anchor = useMemo(() => new Date(), [])
  const days = useMemo(
    () => buildWeekGrid(anchor, trained, program, routineDaysCount),
    [anchor, trained, program, routineDaysCount]
  )
  const today = toLocalDateStr()

  const rangeLabel = useMemo(() => {
    const fmt = (d: string) =>
      new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    return `${fmt(days[0].date)} – ${fmt(days[6].date)}`
  }, [days])

  return (
    <div>
      <p className="kicker">Semana · {rangeLabel}</p>
      <div className="mt-3 flex justify-between">
        {days.map((d) => {
          const dayNum = Number(d.date.slice(8, 10))
          const weekday = WEEKDAY_LETTERS[(new Date(d.date + 'T12:00:00').getDay() + 6) % 7]
          const isToday = d.date === today
          const done = d.status === 'done' || d.status === 'done-scheduled'
          return (
            <div
              key={d.date}
              title={d.date}
              className="flex flex-1 flex-col items-center gap-1.5"
            >
              <span className="text-[0.6rem] font-medium uppercase tracking-widest text-muted/60">
                {weekday}
              </span>
              <span
                className={`flex size-8 items-center justify-center rounded-full font-display text-base font-semibold ${
                  isToday ? 'bg-cta/15 text-accent' : 'text-fg'
                }`}
              >
                {dayNum}
              </span>
              <span
                className={`size-1.5 rounded-full ${done ? 'bg-success' : 'bg-transparent'}`}
                aria-hidden
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
