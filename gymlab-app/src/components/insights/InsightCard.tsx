import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { WeeklyVolumeInsight } from '@/domain/insights'
import { formatVolume } from '@/domain/volume'

type InsightCardProps = {
  insight: WeeklyVolumeInsight
  units: string
}

export const InsightCard = ({ insight, units }: InsightCardProps) => {
  const pct = Math.round(Math.abs(insight.deltaPct))

  if (insight.tone === 'positive') {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-success/40 bg-success/10 p-4">
        <TrendingUp className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
        <div>
          <p className="font-display text-sm font-semibold text-fg">
            Volumen al alza esta semana
          </p>
          <p className="mt-1 text-xs text-muted">
            {pct}% más que la semana anterior ({formatVolume(insight.currentWeekVolume)}{' '}
            {units}). Sigue así.
          </p>
        </div>
      </div>
    )
  }

  if (insight.tone === 'alert') {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-danger/40 bg-danger/10 p-4">
        <TrendingDown className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />
        <div>
          <p className="font-display text-sm font-semibold text-fg">Volumen en descenso</p>
          <p className="mt-1 text-xs text-muted">
            {pct}% menos que la semana anterior ({formatVolume(insight.currentWeekVolume)}{' '}
            {units}). Mantén la constancia para seguir progresando.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-bg-elevated/60 p-4">
      <Minus className="mt-0.5 size-5 shrink-0 text-muted" aria-hidden />
      <div>
        <p className="font-display text-sm font-semibold text-fg">Volumen estable</p>
        <p className="mt-1 text-xs text-muted">
          {formatVolume(insight.currentWeekVolume)} {units} esta semana. Mantén el ritmo.
        </p>
      </div>
    </div>
  )
}
