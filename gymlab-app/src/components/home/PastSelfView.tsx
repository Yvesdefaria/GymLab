// Comparación con yo del pasado: métricas actuales vs 1, 3, 6 meses atrás.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useWorkouts } from '@/hooks/useWorkouts'
import { useWorkoutSets } from '@/hooks/useWorkoutSets'
import { useBodyWeight } from '@/hooks/useBodyWeight'
import { buildPastComparison, type ComparisonPeriod } from '@/domain/pastComparison'
import { prefersReducedMotion } from '@/lib/animations'
import anime from 'animejs'
import { useEffect, useRef } from 'react'

const periods: ComparisonPeriod[] = ['1m', '3m', '6m']

// Barra de progreso comparativa.
const MetricBar = ({ label, current, past, pct, unit }: {
  label: string; current: number; past: number; pct: number; unit: string
}) => {
  const max = Math.max(current, past, 1)
  const currentPct = (current / max) * 100
  const pastPct = (past / max) * 10

  const TrendIcon = pct > 0 ? TrendingUp : pct < 0 ? TrendingDown : Minus
  const trendColor = pct > 0 ? 'text-success' : pct < 0 ? 'text-danger' : 'text-muted'

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[0.65rem] font-medium text-fg">{label}</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 flex flex-col gap-1">
          <div className="h-1.5 rounded-full bg-border/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${currentPct}%` }}
            />
          </div>
          <div className="h-1.5 rounded-full bg-border/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-muted/40 transition-all duration-500"
              style={{ width: `${pastPct}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <TrendIcon className={`size-3 ${trendColor}`} aria-hidden />
          <span className={`text-[0.6rem] font-semibold ${trendColor}`}>
            {pct > 0 ? '+' : ''}{pct}%
          </span>
        </div>
      </div>
      <div className="flex justify-between text-[0.55rem] text-muted">
        <span>{current}{unit}</span>
        <span>{past}{unit}</span>
      </div>
    </div>
  )
}

export const PastSelfView = () => {
  const { t } = useTranslation()
  const { workouts } = useWorkouts()
  const { sets } = useWorkoutSets()
  const { entries } = useBodyWeight()
  const [selectedPeriod, setSelectedPeriod] = useState<ComparisonPeriod>('1m')
  const [visible, setVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const comparisons = useMemo(
    () => buildPastComparison(workouts, sets, entries),
    [workouts, sets, entries]
  )

  const selected = comparisons.find((c) => c.period === selectedPeriod) ?? comparisons[0]

  useEffect(() => {
    if (!containerRef.current) return
    if (prefersReducedMotion()) {
      setVisible(true)
      return
    }
    anime({
      targets: containerRef.current,
      opacity: [0, 1],
      translateY: [8, 0],
      duration: 300,
      easing: 'easeOutCubic',
      complete: () => setVisible(true),
    })
  }, [selectedPeriod])

  // No mostrar si no hay datos suficientes.
  const hasData = comparisons.some((c) => c.current.workoutsCount > 0 || c.past.workoutsCount > 0)
  if (!hasData) return null

  return (
    <div
      ref={containerRef}
      style={{ opacity: visible ? 1 : 0 }}
      className="flex flex-col gap-3"
    >
      <p className="kicker">{t('pastSelf.title')}</p>

      {/* Selector de período */}
      <div className="flex gap-1.5">
        {periods.map((p) => (
          <button
            key={p}
            onClick={() => {
              setVisible(false)
              setSelectedPeriod(p)
            }}
            className={`flex-1 rounded-lg px-2 py-1.5 text-[0.65rem] font-medium transition-colors ${
              selectedPeriod === p
                ? 'bg-accent text-accent-fg'
                : 'bg-bg-elevated/50 text-muted hover:bg-bg-elevated'
            }`}
          >
            {t(`pastSelf.period.${p}`)}
          </button>
        ))}
      </div>

      {/* Métricas */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/30 bg-bg-elevated/30 px-3 py-3">
        <MetricBar
          label={t('pastSelf.e1rm')}
          current={selected.current.avgE1rm}
          past={selected.past.avgE1rm}
          pct={selected.deltas.e1rmPct}
          unit=" kg"
        />
        <MetricBar
          label={t('pastSelf.weeklyVolume')}
          current={selected.current.weeklyVolume}
          past={selected.past.weeklyVolume}
          pct={selected.deltas.volumePct}
          unit=" kg"
        />
        {selected.deltas.weightDelta != null && (
          <MetricBar
            label={t('pastSelf.weight')}
            current={selected.current.weightKg ?? 0}
            past={selected.past.weightKg ?? 0}
            pct={selected.deltas.weightPct ?? 0}
            unit=" kg"
          />
        )}
      </div>

      {/* Resumen textual */}
      <p className="text-[0.65rem] text-muted">
        {t('pastSelf.summary', {
          period: selected.label,
          workouts: selected.current.workoutsCount,
          pastWorkouts: selected.past.workoutsCount,
        })}
      </p>
    </div>
  )
}
