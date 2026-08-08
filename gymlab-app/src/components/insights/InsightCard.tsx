// Tarjeta de insight semanal sobre la tendencia del volumen de entrenamiento.
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { WeeklyVolumeInsight } from '@/domain/insights'
import { formatVolume } from '@/domain/volume'
import { InfoTip } from '@/components/ui/InfoTip'

type InsightCardProps = {
  insight: WeeklyVolumeInsight
  units: string
}

// Muestra un mensaje según el tono del insight: alza, descenso o estabilidad.
export const InsightCard = ({ insight, units }: InsightCardProps) => {
  const pct = Math.round(Math.abs(insight.deltaPct))

  if (insight.tone === 'positive') {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-success/40 bg-success/10 p-4">
        <TrendingUp className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-display text-sm font-semibold text-fg">
              Volumen al alza esta semana
            </p>
            <InfoTip label="Qué significa el volumen al alza">
              El volumen es la carga total semanal (kg: serie × peso). Subir más de un 5% frente a
              la semana anterior es buena señal; mantén la técnica y el descanso para sostenerlo.
            </InfoTip>
          </div>
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
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-display text-sm font-semibold text-fg">Volumen en descenso</p>
            <InfoTip label="Qué significa el volumen en descenso">
              El volumen es la carga total semanal (kg: serie × peso). Una caída de más del 10%
              frente a la semana anterior puede indicar fatiga o menos constancia; es orientativo,
              escucha a tu cuerpo.
            </InfoTip>
          </div>
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
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-display text-sm font-semibold text-fg">Volumen estable</p>
          <InfoTip label="Qué significa el volumen estable">
            El volumen es la carga total semanal (kg: serie × peso). Se considera estable cuando
            varía menos de un ±10% frente a la semana anterior. Es solo informativo, no cambia tu plan.
          </InfoTip>
        </div>
        <p className="mt-1 text-xs text-muted">
          {formatVolume(insight.currentWeekVolume)} {units} esta semana. Mantén el ritmo.
        </p>
      </div>
    </div>
  )
}
