import { useMemo } from 'react'
import { buildWeekGrid } from '@/domain/calendar'
import { toLocalDateStr } from '@/domain/dates'
import type { ActiveProgram } from '@/domain/types'
import { statusClass } from './MonthCalendar'

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

  const weekLabel = useMemo(() => {
    const fmt = (d: string) =>
      new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    return `${fmt(days[0].date)} – ${fmt(days[6].date)}`
  }, [days])

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          Esta semana · {weekLabel}
        </p>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const dayNum = Number(d.date.slice(8, 10))
          const weekday = WEEKDAY_LETTERS[(new Date(d.date + 'T12:00:00').getDay() + 6) % 7]
          const isToday = d.date === today
          return (
            <div
              key={d.date}
              className={`flex min-h-[56px] flex-col items-center justify-center rounded-xl border text-sm ${statusClass[d.status]} ${isToday ? 'ring-1 ring-accent' : ''}`}
              title={d.status}
            >
              <span className="text-[0.6rem] font-semibold uppercase opacity-70">{weekday}</span>
              <span className="font-medium">{dayNum}</span>
            </div>
          )
        })}
      </div>

      <p className="mt-2 text-[0.65rem] text-muted">● Hecho · ○ Programado · ◐ Ambos · − Descanso</p>
    </div>
  )
}
