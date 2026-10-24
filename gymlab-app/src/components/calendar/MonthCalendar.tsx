// F132.2/Q3 — calendario mensual Nocturno: lunes-primero, celdas circulares,
// intensidad por volumen, estrella verde en la meta y navegación solo hacia atrás
// por los meses con datos. Reemplaza la grilla rectangular con tarjetas.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Flame, Play, Star } from 'lucide-react'
import { buildMonthGrid, programProgressPct } from '@/domain/calendar'
import { toLocalDateStr } from '@/domain/dates'
import { applyUnits, formatUnits } from '@/domain/settings'
import { useSettings } from '@/hooks/useSettings'
import { formatDate, weekdayLetters } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { ActiveProgram } from '@/domain/types'

export interface MonthCalendarProps {
  trained: Set<string>
  volumeByDate: Map<string, number>
  availableMonths: string[]
  program: ActiveProgram | null
  routineDaysCount: number
  onNavigateMonth?: () => void
}

const CURRENT_KEY = () => toLocalDateStr().slice(0, 7)

export const MonthCalendar = ({
  trained,
  volumeByDate,
  availableMonths,
  program,
  routineDaysCount,
  onNavigateMonth,
}: MonthCalendarProps) => {
  const { t, i18n } = useTranslation()
  const { settings } = useSettings()
  const lang = i18n.language as AppLanguage
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const months = useMemo(() => {
    const set = new Set(availableMonths)
    set.add(CURRENT_KEY())
    return [...set].sort()
  }, [availableMonths])
  const selectedKey = `${year}-${String(month + 1).padStart(2, '0')}`
  const selectedIndex = months.indexOf(selectedKey)
  const prevKey = selectedIndex > 0 ? months[selectedIndex - 1] : undefined
  const nextKey =
    selectedIndex >= 0 && selectedIndex < months.length - 1 ? months[selectedIndex + 1] : undefined

  const days = useMemo(
    () => buildMonthGrid(year, month, trained, program, routineDaysCount),
    [year, month, trained, program, routineDaysCount]
  )

  // Lunes-primero: getDay() devuelve 0=Domingo; el pad se corre 6.
  const startPad = (new Date(year, month, 1).getDay() + 6) % 7
  const today = toLocalDateStr()
  const monthHasSessions = days.some((d) => d.status === 'done' || d.status === 'done-scheduled')
  const hasAnySession = trained.size > 0

  const sessions = days.filter((d) => d.status === 'done' || d.status === 'done-scheduled').length
  const volume = days.reduce((sum, d) => sum + (volumeByDate.get(d.date) ?? 0), 0)
  const maxVolume = days.reduce((max, d) => Math.max(max, volumeByDate.get(d.date) ?? 0), 0)
  const programProgress = programProgressPct([...trained], program, routineDaysCount)

  const goTo = (key: string | undefined) => {
    if (!key) return
    const [nextYear, nextMonth] = key.split('-').map(Number)
    setYear(nextYear)
    setMonth(nextMonth - 1)
    onNavigateMonth?.()
  }

  const rawTitle = formatDate(new Date(year, month, 1), lang, {
    month: 'long',
    year: 'numeric',
  })
  // es devuelve «octubre de 2026»; el mockup usa «Octubre 2026».
  const title = rawTitle.replace(' de ', ' ')
  const displayTitle = title.charAt(0).toUpperCase() + title.slice(1)
  const monthLetters = weekdayLetters(lang)

  const statusLabel = (status: string): string => {
    if (status === 'done-scheduled') return t('calendario.metaCumplida')
    if (status === 'done') return t('calendario.entrenado')
    if (status === 'scheduled') return t('calendario.programado')
    return t('calendario.descanso')
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-3">
        <button
          type="button"
          onClick={() => goTo(prevKey)}
          disabled={!prevKey}
          aria-label={t('calendario.mesAnterior')}
          className="flex size-10 items-center justify-center rounded-full border border-border text-gold disabled:opacity-30"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <div className="min-w-0 text-center">
          <h2
            data-testid="cal-month-title"
            className="truncate font-display text-2xl font-normal tracking-wide text-fg"
          >
            {displayTitle}
          </h2>
          <p className="mt-0.5 text-[9px] text-muted">
            {t('calendario.entrenos')} {sessions} · {Math.round(applyUnits(volume, settings.units)).toLocaleString()}{' '}
            {formatUnits(settings.units)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => goTo(nextKey)}
          disabled={!nextKey}
          aria-label={t('calendario.mesSiguiente')}
          className="flex size-10 items-center justify-center rounded-full border border-border text-gold disabled:opacity-30"
        >
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-center gap-4 text-[8px] text-muted">
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-full bg-gold/55" aria-hidden />
          {t('calendario.entrenado')}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-full border border-gold/50" aria-hidden />
          {t('calendario.programado')}
        </span>
        <span className="inline-flex items-center gap-1">
          <Star className="size-2.5 fill-success text-success" aria-hidden />
          {t('calendario.metaCumplida')}
        </span>
      </div>

      <div data-testid="cal-week" className="mt-2 grid grid-cols-7 gap-1 text-center">
        {monthLetters.map((letter) => (
          <span key={letter} className="text-[8px] font-semibold uppercase tracking-[0.12em] text-muted">
            {letter}
          </span>
        ))}
      </div>

      <div data-testid="cal-grid" className="mt-1 grid grid-cols-7 gap-1" role="grid" aria-label={displayTitle}>
        {Array.from({ length: startPad }).map((_, index) => (
          <span key={`pad-${index}`} className="min-h-11" aria-hidden />
        ))}
        {days.map((day) => {
          const dayNumber = Number(day.date.slice(8, 10))
          const done = day.status === 'done' || day.status === 'done-scheduled'
          const scheduled = day.status === 'scheduled'
          const isToday = day.date === today
          const future = day.date > today
          const volumeForDay = volumeByDate.get(day.date) ?? 0
          const pct = maxVolume > 0 ? volumeForDay / maxVolume : 0
          const intensity = done ? Math.round(12 + pct * 22) : 0
          const routineLabel =
            day.routineDayIndex !== null ? t('calendario.dia', { n: day.routineDayIndex + 1 }) : ''
          const aria = `${formatDate(`${day.date}T12:00:00`, lang, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })} · ${statusLabel(day.status)}${routineLabel ? ` · ${routineLabel}` : ''}`

          return (
            <div key={day.date} className="flex min-h-11 items-center justify-center">
              <div
                role="gridcell"
                aria-label={aria}
                className={`relative flex size-10 items-center justify-center rounded-full text-[11px] tabular-nums ${
                  done
                    ? 'text-fg'
                    : scheduled
                      ? `border border-gold/45 text-gold-bright ${future ? 'border-dashed' : ''}`
                      : `text-muted ${future ? 'opacity-45' : ''}`
                } ${isToday ? 'ring-1 ring-gold' : ''}`}
                style={
                  done
                    ? {
                        background: `color-mix(in srgb, var(--color-gold) ${intensity}%, transparent)`,
                      }
                    : undefined
                }
              >
                {dayNumber}
                {day.status === 'done-scheduled' && (
                  <Star
                    className="absolute bottom-0 right-0 size-2.5 fill-success text-success"
                    aria-hidden
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div data-testid="cal-stats" className="mt-3 grid grid-cols-3 divide-x divide-border/40 border-y border-border/40 py-3 text-center">
        <div className="px-2">
          <p className="kicker">{t('calendario.entrenos')}</p>
          <p className="mt-0.5 font-display text-xl font-light tabular-nums text-fg">{sessions}</p>
        </div>
        <div className="px-2">
          <p className="kicker">{t('calendario.volumen')}</p>
          <p className="mt-0.5 font-display text-xl font-light tabular-nums text-fg">
            {Math.round(applyUnits(volume, settings.units)).toLocaleString()}{' '}
            <small className="font-sans text-[9px] text-muted">{formatUnits(settings.units)}</small>
          </p>
        </div>
        <div className="px-2">
          <p className="kicker">{t('calendario.programa')}</p>
          <p className="mt-0.5 font-display text-xl font-light tabular-nums text-fg">{programProgress}%</p>
        </div>
      </div>

      {!monthHasSessions && (
        <div className="border-b border-border/40 py-5 text-center">
          <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-gold/10 text-gold">
            <Flame className="size-5" aria-hidden />
          </span>
          <p className="mt-2 font-display text-sm font-medium text-fg">
            {hasAnySession ? t('calendario.sinEntrenosMes') : t('calendario.sinSesiones')}
          </p>
          <p className="mx-auto mt-1 max-w-xs text-[10px] leading-relaxed text-muted">
            {hasAnySession ? t('calendario.sinEntrenosMesTexto') : t('calendario.sinSesionesTexto')}
          </p>
          <Link
            to="/"
            className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-[10px] font-semibold text-gold-bright"
          >
            <Play className="size-3.5" aria-hidden />
            {hasAnySession ? t('calendario.seguirEntrenando') : t('calendario.empezarAhora')}
          </Link>
        </div>
      )}
    </div>
  )
}
