import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { buildMonthGrid } from '@/domain/calendar'
import { toLocalDateStr } from '@/domain/dates'
import type { ActiveProgram } from '@/domain/types'

export type CalendarDayStatus = 'rest' | 'scheduled' | 'done' | 'done-scheduled'

export interface MonthCalendarProps {
  trained: Set<string>
  program: ActiveProgram | null
  routineDaysCount: number
  compact?: boolean
  onNavigateMonth?: () => void
}

const statusClass: Record<CalendarDayStatus, string> = {
  rest: 'bg-bg text-muted border-border/40',
  scheduled: 'bg-cta/15 text-accent-soft border-cta/50',
  done: 'bg-success/20 text-success border-success/50',
  'done-scheduled': 'bg-success/30 text-success border-cta',
}

export const MonthCalendar = ({
  trained,
  program,
  routineDaysCount,
  compact = false,
  onNavigateMonth,
}: MonthCalendarProps) => {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const days = useMemo(
    () => buildMonthGrid(year, month, trained, program, routineDaysCount),
    [year, month, trained, program, routineDaysCount]
  )

  const startPad = new Date(year, month, 1).getDay()
  const today = toLocalDateStr()

  const prev = () => {
    setMonth((m) => {
      if (m === 0) {
        setYear((y) => y - 1)
        return 11
      }
      return m - 1
    })
    onNavigateMonth?.()
  }
  const next = () => {
    setMonth((m) => {
      if (m === 11) {
        setYear((y) => y + 1)
        return 0
      }
      return m + 1
    })
    onNavigateMonth?.()
  }

  const title = new Date(year, month, 1).toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div>
      <div className="flex items-center justify-between rounded-2xl border border-gold/40 bg-bg-elevated px-2 py-2">
        <button
          type="button"
          onClick={prev}
          className="flex size-11 items-center justify-center rounded-xl text-accent"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="size-5" />
        </button>
        <span className="font-display text-base capitalize text-fg">{title}</span>
        <button
          type="button"
          onClick={next}
          className="flex size-11 items-center justify-center rounded-xl text-accent"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[0.65rem] uppercase text-muted">
        {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: startPad }).map((_, i) => (
          <span key={`p-${i}`} />
        ))}
        {days.map((d) => {
          const dayNum = Number(d.date.slice(8, 10))
          const isToday = d.date === today
          return (
            <div
              key={d.date}
              className={`flex flex-col items-center justify-center rounded-xl border text-sm ${compact ? 'min-h-[36px] py-1' : 'min-h-[44px]'} ${statusClass[d.status]} ${isToday ? 'ring-1 ring-accent' : ''}`}
              title={d.status}
            >
              <span className="font-medium">{dayNum}</span>
              {d.routineDayIndex !== null ? (
                <span className="text-[0.55rem] opacity-80">D{d.routineDayIndex + 1}</span>
              ) : null}
            </div>
          )
        })}
      </div>

      {!compact ? (
        <ul className="mt-3 space-y-1 text-xs text-muted">
          <li>● Hecho · ○ Programado · ◐ Ambos · − Descanso</li>
          <li>
            Activa un programa desde el detalle de una rutina (“Seguir rutina”) para ver días
            programados.
          </li>
        </ul>
      ) : null}
    </div>
  )
}
