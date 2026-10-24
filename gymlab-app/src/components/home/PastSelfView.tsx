// Comparación compacta con el yo del pasado: periodo + tres deltas, sin barras.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { buildPastComparison, type ComparisonPeriod } from '@/domain/pastComparison'
import type { Workout, WorkoutSet, BodyWeightEntry } from '@/domain/types'

const PERIODS: ComparisonPeriod[] = ['1m', '3m', '6m']

type PastSelfViewProps = {
  workouts: Workout[]
  sets: WorkoutSet[]
  entries: BodyWeightEntry[]
}

const signed = (value: number): string => {
  const rounded = Math.round(value)
  if (rounded > 0) return `+${rounded}%`
  if (rounded < 0) return `−${Math.abs(rounded)}%`
  return '0%'
}

export const PastSelfView = ({ workouts, sets, entries }: PastSelfViewProps) => {
  const { t } = useTranslation()
  const [period, setPeriod] = useState<ComparisonPeriod>('1m')

  const comparisons = useMemo(
    () => buildPastComparison(workouts, sets, entries),
    [workouts, sets, entries],
  )
  const selected = comparisons.find((comparison) => comparison.period === period) ?? comparisons[0]

  const hasData = comparisons.some(
    (comparison) => comparison.current.workoutsCount > 0 || comparison.past.workoutsCount > 0,
  )
  if (!hasData || !selected) return null

  const metrics = [
    { label: t('pastSelf.strengthShort'), value: signed(selected.deltas.e1rmPct) },
    { label: t('pastSelf.volumeShort'), value: signed(selected.deltas.volumePct) },
    ...(selected.deltas.weightDelta != null
      ? [{ label: t('pastSelf.weightShort'), value: signed(selected.deltas.weightPct ?? 0) }]
      : []),
  ]

  return (
    <section className="mt-5 border-t border-border/40 pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.19em] text-muted">
          {t('pastSelf.title')}
        </h2>
      </div>

      <div className="mt-2 flex gap-1.5">
        {PERIODS.map((value) => {
          const active = value === period
          return (
            <button
              key={value}
              type="button"
              onClick={() => setPeriod(value)}
              aria-pressed={active}
              className={`min-h-[44px] flex-1 rounded-lg border text-[9.5px] font-medium transition-colors ${
                active
                  ? 'border-gold/50 bg-gold/10 text-gold-bright'
                  : 'border-border/40 text-muted'
              }`}
            >
              {t(`pastSelf.period.${value}`)}
            </button>
          )
        })}
      </div>

      <div className="mt-3 grid grid-cols-3 divide-x divide-border/40 text-center">
        {metrics.map((metric) => (
          <div key={metric.label} className="px-1">
            <strong
              className={`block font-display text-xl font-light tabular-nums ${
                metric.value.startsWith('+') ? 'text-gold-bright' : 'text-muted'
              }`}
            >
              {metric.value}
            </strong>
            <span className="mt-1 block text-[7px] font-semibold uppercase tracking-[0.13em] text-muted">
              {metric.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
