// Calendario mensual con estado de cada día (descanso/programado/hecho) y navegación entre meses.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Flame, Play } from 'lucide-react'
import { buildMonthGrid } from '@/domain/calendar'
import { toLocalDateStr } from '@/domain/dates'
import { weekdayLetters, formatDate } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { ActiveProgram } from '@/domain/types'

// Estado visual de un día: combinación de día de descanso, programado y/o entrenado.
export type CalendarDayStatus = 'rest' | 'scheduled' | 'done' | 'done-scheduled'

export interface MonthCalendarProps {
  trained: Set<string>
  program: ActiveProgram | null
  routineDaysCount: number
  compact?: boolean
  onNavigateMonth?: () => void
}

// Clases de estilo por estado de día para rellenar cada celda del mes.
const statusClass: Record<CalendarDayStatus, string> = {
  rest: 'bg-bg text-muted border-border/40',
  scheduled: 'bg-cta/15 text-accent-soft border-cta/50',
  done: 'bg-success/20 text-success border-success/50',
  'done-scheduled': 'bg-success/30 text-success border-cta',
}

// Vista mensual de entrenamientos; la grilla de días se calcula en el dominio.
export const MonthCalendar = ({
  trained,
  program,
  routineDaysCount,
  compact = false,
  onNavigateMonth,
}: MonthCalendarProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const monthLetters = weekdayLetters(lang, 0)
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const days = useMemo(
    () => buildMonthGrid(year, month, trained, program, routineDaysCount),
    [year, month, trained, program, routineDaysCount]
  )

  const startPad = new Date(year, month, 1).getDay()
  const today = toLocalDateStr()

  const monthHasSessions = days.some(
    (d) => d.status === 'done' || d.status === 'done-scheduled'
  )
  const hasAnySession = trained.size > 0

  // Navegación entre meses manejando el desborde de año (diciembre <-> enero).
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

  const title = formatDate(new Date(year, month, 1), lang, {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div>
      <div className="flex items-center justify-between panel rounded-2xl px-2 py-2">
        <button
          type="button"
          onClick={prev}
          className="flex size-11 items-center justify-center rounded-xl text-accent"
          aria-label={t('calendario.mesAnterior')}
        >
          <ChevronLeft className="size-5" />
        </button>
        <span className="font-display text-base capitalize text-fg">{title}</span>
        <button
          type="button"
          onClick={next}
          className="flex size-11 items-center justify-center rounded-xl text-accent"
          aria-label={t('calendario.mesSiguiente')}
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[0.65rem] uppercase text-muted">
        {monthLetters.map((d) => (
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
              className={`flex flex-col items-center justify-center rounded-xl border text-sm ${compact ? 'min-h-[44px] py-1' : 'min-h-[44px]'} ${statusClass[d.status]} ${isToday ? 'ring-1 ring-accent' : ''}`}
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

      {!monthHasSessions && (
        <div className="mt-3 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-gold/40 bg-bg-elevated/50 px-4 py-6 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-cta/15">
            <Flame className="size-5 text-cta" aria-hidden />
          </span>
          <p className="font-display text-sm font-semibold text-fg">
            {hasAnySession ? t('calendario.sinEntrenosMes') : t('calendario.sinSesiones')}
          </p>
          <p className="max-w-xs text-xs leading-relaxed text-muted">
            {hasAnySession
              ? t('calendario.sinEntrenosMesTexto')
              : t('calendario.sinSesionesTexto')}
          </p>
          <Link
            to="/"
            className="mt-1 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-cta px-4 text-sm font-semibold text-on-gold transition-opacity hover:opacity-90"
          >
            <Play className="size-4" aria-hidden />
            {hasAnySession ? t('calendario.seguirEntrenando') : t('calendario.empezarAhora')}
          </Link>
        </div>
      )}

      {!compact ? (
        <ul className="mt-3 space-y-1 text-xs text-muted">
          <li>{t('calendario.leyenda')}</li>
          <li>{t('calendario.pistaPrograma')}</li>
        </ul>
      ) : null}
    </div>
  )
}
