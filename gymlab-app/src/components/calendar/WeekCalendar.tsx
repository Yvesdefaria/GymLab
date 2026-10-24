// Week strip de la home: 7 días con disco (verde + estrella si se entrenó, anillo si es hoy).
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { buildWeekGrid } from '@/domain/calendar'
import { toLocalDateStr } from '@/domain/dates'
import { weekdayLetters } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { ActiveProgram } from '@/domain/types'

export interface WeekCalendarProps {
  trained: Set<string>
  program: ActiveProgram | null
  routineDaysCount: number
}

// Semana actual en una sola fila: el día cumplido se reconoce por el disco verde,
// no por un borde de tarjeta.
export const WeekCalendar = ({ trained, program, routineDaysCount }: WeekCalendarProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const letters = weekdayLetters(lang)
  const today = toLocalDateStr()

  const anchor = useMemo(() => new Date(), [])
  const days = useMemo(
    () => buildWeekGrid(anchor, trained, program, routineDaysCount),
    [anchor, trained, program, routineDaysCount],
  )

  return (
    <Link
      to="/calendario"
      aria-label={t('calendario.irCompleto')}
      className="block border-b border-border/40 px-4 py-3.5"
      data-tour="home-calendar"
    >
      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((d) => {
          const dayNum = Number(d.date.slice(8, 10))
          const weekday = letters[(new Date(d.date + 'T12:00:00').getDay() + 6) % 7]
          const isToday = d.date === today
          const done = d.status === 'done' || d.status === 'done-scheduled'
          const scheduled = d.status === 'scheduled' || d.status === 'done-scheduled'

          const discClass = done
            ? 'bg-success text-bg'
            : isToday
              ? 'week-today border-[1.5px] border-cta text-gold-bright'
              : scheduled
                ? 'border border-border/60 text-fg/75'
                : 'border border-dashed border-border/50 text-muted/70'

          return (
            <div key={d.date} className="flex flex-col items-center gap-1">
              <span
                className={`text-[7.5px] font-semibold uppercase tracking-[0.16em] ${
                  isToday ? 'text-gold' : 'text-muted/70'
                }`}
              >
                {weekday}
              </span>
              <span
                className={`flex size-[30px] items-center justify-center rounded-full font-display text-[11px] tabular-nums ${discClass}`}
              >
                {done ? <Star className="size-3 fill-current" aria-hidden="true" /> : dayNum}
              </span>
              <span
                className={`text-[7.5px] font-medium ${
                  isToday ? 'text-gold-bright' : 'text-muted/60'
                }`}
              >
                {isToday ? t('home.hoy') : done ? dayNum : '\u00A0'}
              </span>
            </div>
          )
        })}
      </div>
    </Link>
  )
}
