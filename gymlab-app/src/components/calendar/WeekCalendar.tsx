import { useMemo } from 'react'
import { CalendarDays, Check } from 'lucide-react'
import { buildWeekGrid } from '@/domain/calendar'
import type { CalendarDay, CalendarDayStatus } from '@/domain/calendar'
import { toLocalDateStr } from '@/domain/dates'
import type { ActiveProgram } from '@/domain/types'

export interface WeekCalendarProps {
  trained: Set<string>
  program: ActiveProgram | null
  routineDaysCount: number
}

const WEEKDAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const STATUS_LABELS: Record<CalendarDayStatus, (day: CalendarDay) => string> = {
  rest: () => 'Descanso',
  scheduled: (d) => `Programado · D${(d.routineDayIndex ?? 0) + 1}`,
  done: () => 'Entrenado',
  'done-scheduled': (d) => `Entrenado · D${(d.routineDayIndex ?? 0) + 1}`,
}

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

  const doneCount = days.filter(
    (d) => d.status === 'done' || d.status === 'done-scheduled'
  ).length

  return (
    <div>
      <div className="mb-3 flex items-end justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-cta" aria-hidden />
          <div>
            <p className="kicker">Semana vigente</p>
            <p className="font-display text-lg font-semibold leading-tight text-fg">{rangeLabel}</p>
          </div>
        </div>
        {doneCount > 0 && (
          <div className="text-right">
            <p className="stat-value text-xl">
              {doneCount}
              <span className="text-sm text-muted">/{days.length}</span>
            </p>
            <p className="kicker">días</p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border/50 bg-bg/70 p-1.5">
        <div className="grid grid-cols-7 gap-1">
          {days.map((d, i) => {
            const dayNum = Number(d.date.slice(8, 10))
            const weekday = WEEKDAY_LETTERS[(new Date(d.date + 'T12:00:00').getDay() + 6) % 7]
            const isToday = d.date === today
            const done = d.status === 'done' || d.status === 'done-scheduled'
            const scheduled = d.status === 'scheduled' || d.status === 'done-scheduled'
            const label = STATUS_LABELS[d.status](d) + (isToday ? ' · Hoy' : '')

            const cellCls =
              d.status === 'done-scheduled'
                ? 'border-cta/50 bg-cta/15'
                : d.status === 'done'
                  ? 'border-success/40 bg-success/10'
                  : d.status === 'scheduled'
                    ? 'border-cta/40 bg-cta/10'
                    : 'border-border/40 bg-bg'

            const barCls =
              d.status === 'done' || d.status === 'done-scheduled'
                ? 'bg-success'
                : scheduled
                  ? 'bg-cta'
                  : 'bg-border/50'

            return (
              <div
                key={d.date}
                title={label}
                className={`reveal relative flex min-h-[72px] flex-col items-center overflow-hidden rounded-lg border pt-1 ${cellCls} ${isToday ? 'gold-border-glow border-cta' : ''}`}
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <span className={`h-1 w-full ${barCls}`} aria-hidden />
                <span
                  className={`mt-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.15em] ${
                    isToday ? 'font-bold text-cta' : 'text-muted/70'
                  }`}
                >
                  {isToday ? 'Hoy' : weekday}
                </span>
                <span
                  className={`mt-1 font-display text-xl font-bold leading-none ${
                    isToday ? 'text-accent' : done ? 'text-success' : scheduled ? 'text-accent-soft' : 'text-fg'
                  }`}
                >
                  {dayNum}
                </span>
                <span className="mt-1.5 flex min-h-[16px] items-center justify-center">
                  {done ? (
                    <Check className="size-3.5 text-success" strokeWidth={3} />
                  ) : scheduled ? (
                    <span className="rounded bg-cta/20 px-1 py-px text-[0.58rem] font-bold text-accent-soft">
                      D{(d.routineDayIndex ?? 0) + 1}
                    </span>
                  ) : (
                    <span className="size-1 rounded-full bg-border/60" />
                  )}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-3 text-[0.65rem] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-success" aria-hidden /> Hecho
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-cta" aria-hidden /> Programado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-border" aria-hidden /> Descanso
        </span>
      </div>
    </div>
  )
}
