// Resumen semanal de 7 días que enlaza al calendario completo; resalta hoy y el estado de cada día.
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { buildWeekGrid } from '@/domain/calendar'
import { toLocalDateStr } from '@/domain/dates'
import type { ActiveProgram } from '@/domain/types'

export interface WeekCalendarProps {
  trained: Set<string>
  program: ActiveProgram | null
  routineDaysCount: number
}

// Letras de los días de la semana en español (L=0 … D=6), alineadas con el array de la grilla.
const WEEKDAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

// Semana actual como cabecera compacta; al pulsarla navega al calendario completo.
export const WeekCalendar = ({ trained, program, routineDaysCount }: WeekCalendarProps) => {
  // La semana se fija una vez al montar para que no "salte" al pasar de medianoche.
  const anchor = useMemo(() => new Date(), [])
  const days = useMemo(
    () => buildWeekGrid(anchor, trained, program, routineDaysCount),
    [anchor, trained, program, routineDaysCount]
  )
  const today = toLocalDateStr()

  const todayLabel = useMemo(() => {
    const d = new Date()
    return `${d.getDate()} ${d.toLocaleDateString('es-ES', { month: 'long' })}`
  }, [])

  return (
    <Link to="/calendario" aria-label="Ir al calendario completo" className="block">
      <p className="font-display text-lg font-semibold leading-tight text-fg">{todayLabel}</p>
      <div className="mt-3 flex justify-between">
        {days.map((d) => {
          const dayNum = Number(d.date.slice(8, 10))
          // Ajusta getDay() (domingo=0) para que la semana empiece en lunes, como en la grilla.
          const weekday = WEEKDAY_LETTERS[(new Date(d.date + 'T12:00:00').getDay() + 6) % 7]
          const isToday = d.date === today
          const done = d.status === 'done' || d.status === 'done-scheduled'
          const scheduled = d.status === 'scheduled' || d.status === 'done-scheduled'
          const numberCls = isToday
            ? `bg-cta/15 ${done ? 'text-success' : 'text-accent'}`
            : done
              ? 'text-success'
              : scheduled
                ? 'text-accent-soft'
                : 'text-fg'
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
                className={`flex size-8 items-center justify-center rounded-full font-display text-base font-semibold ${numberCls}`}
              >
                {dayNum}
              </span>
            </div>
          )
        })}
      </div>
    </Link>
  )
}
