// Resumen semanal de 7 días con nombre del día de rutina; enlaza al calendario completo.
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { buildWeekGrid } from '@/domain/calendar'
import { toLocalDateStr } from '@/domain/dates'
import { weekdayLetters, formatDate } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { ActiveProgram, RoutineDay } from '@/domain/types'

export interface WeekCalendarProps {
  trained: Set<string>
  program: ActiveProgram | null
  routineDaysCount: number
  routineDays?: RoutineDay[]
}

// Semana actual como cabecera compacta; muestra día de rutina y enlaza al calendario completo.
export const WeekCalendar = ({ trained, program, routineDaysCount, routineDays }: WeekCalendarProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const letters = weekdayLetters(lang)
  const anchor = useMemo(() => new Date(), [])
  const days = useMemo(
    () => buildWeekGrid(anchor, trained, program, routineDaysCount),
    [anchor, trained, program, routineDaysCount]
  )
  const today = toLocalDateStr()

  const todayLabel = useMemo(() => {
    const d = new Date()
    return `${d.getDate()} ${formatDate(d, lang, { month: 'long' })}`
  }, [lang])

  // Mapa rápido dayIndex → nombre del día de rutina.
  const dayNameMap = useMemo(() => {
    if (!routineDays || routineDays.length === 0) return null
    const map = new Map<number, string>()
    for (const rd of routineDays) map.set(rd.dayIndex, rd.name)
    return map
  }, [routineDays])

  return (
    <Link to="/calendario" aria-label={t('calendario.irCompleto')} className="block">
      <p className="font-display text-lg font-semibold leading-tight text-fg">{todayLabel}</p>
      <div className="mt-3 flex justify-between">
        {days.map((d) => {
          const dayNum = Number(d.date.slice(8, 10))
          const weekday = letters[(new Date(d.date + 'T12:00:00').getDay() + 6) % 7]
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
          // Nombre del día de rutina si está programado, o "Descanso".
          const routineLabel =
            scheduled && d.routineDayIndex != null && dayNameMap
              ? dayNameMap.get(d.routineDayIndex) ?? `D${d.routineDayIndex + 1}`
              : scheduled
                ? `D${(d.routineDayIndex ?? 0) + 1}`
                : t('home.descanso')
          return (
            <div
              key={d.date}
              title={d.date}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <span className="text-[0.6rem] font-medium uppercase tracking-widest text-muted/60">
                {weekday}
              </span>
              <span
                className={`flex size-8 items-center justify-center rounded-full font-display text-base font-semibold ${numberCls}`}
              >
                {dayNum}
              </span>
              <span
                className={`max-w-[3rem] truncate text-center text-[0.55rem] leading-tight ${
                  scheduled ? 'text-accent-soft/80' : 'text-muted/50'
                }`}
              >
                {routineLabel}
              </span>
            </div>
          )
        })}
      </div>
    </Link>
  )
}
