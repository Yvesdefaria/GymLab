// Mini calendario semanal de /pasos (dirección C): 7 días de la semana actual.
// Cumplido = disco verde con estrella centrada; parcial = anillo dorado; futuro =
// círculo vacío. Sin navegación entre semanas en esta versión.
import { useTranslation } from 'react-i18next'
import { Star } from 'lucide-react'
import { buildWeekSeries } from './stepSeries'
import type { AppLanguage } from '@/domain/onboarding'
import type { DailyStepsEntry } from '@/domain/types'
import { formatDayShort, formatStepNumber, weekdayLetters } from '@/lib/intl'

type StepWeekStripProps = {
  week: DailyStepsEntry[]
  goal: number
  today: string
}

const WeekRing = ({ pct }: { pct: number }) => {
  const size = 32
  const stroke = 2.5
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (Math.min(100, Math.max(0, pct)) / 100) * c

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="-rotate-90"
      aria-hidden
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-border/50"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--color-cta)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
      />
    </svg>
  )
}

export const StepWeekStrip = ({ week, goal, today }: StepWeekStripProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const series = buildWeekSeries(week, today, weekdayLetters(lang, 1))

  return (
    <div
      className="grid grid-cols-7 gap-1.5 pb-1 text-center"
      role="list"
    >
      {series.map((point) => {
        const future = point.date > today
        const done = goal > 0 && point.steps >= goal
        const pct = goal > 0 ? (point.steps / goal) * 100 : 0
        const isToday = point.date === today
        const label = t('steps.heatmapDay', {
          date: formatDayShort(point.date, lang),
          count: formatStepNumber(point.steps, lang),
        })

        return (
          <div
            key={point.date}
            role="listitem"
            aria-label={label}
            className="flex flex-col items-center gap-1"
          >
            <span className="text-[9px] uppercase tracking-widest text-muted">
              {point.label}
            </span>
            {done ? (
              <span className="flex size-8 items-center justify-center rounded-full bg-success text-bg">
                <Star className="size-3.5 fill-current" aria-hidden />
              </span>
            ) : (
              <span className={future ? 'opacity-35' : ''}>
                <WeekRing pct={pct} />
              </span>
            )}
            <span
              className={`text-[9px] tabular-nums text-muted ${
                isToday ? 'text-gold-bright' : ''
              }`}
            >
              {Number(point.date.slice(8, 10))}
            </span>
            {isToday ? (
              <span className="text-[7px] uppercase leading-none tracking-[0.1em] text-gold">
                {t('steps.today')}
              </span>
            ) : (
              <span className="h-[8px]" aria-hidden />
            )}
          </div>
        )
      })}
    </div>
  )
}
