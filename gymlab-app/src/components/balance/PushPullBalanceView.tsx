// Balance push/pull/legs: filas hairline y barras finas con los colores
// categóricos de datos. El check de equilibrio usa verde; el desbalance, warning.
import { useTranslation } from 'react-i18next'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { InfoTip } from '@/components/ui/InfoTip'
import { useDataColors } from '@/hooks/useDataColors'
import {
  PUSH_PULL_ALERT_PCT,
  calculatePushPullPercentages,
  detectImbalance,
  type PushPullCategory,
} from '@/domain/pushPullBalance'
import type { MuscleGroup } from '@/domain/types'

interface PushPullBalanceViewProps {
  volumeByMuscle: Partial<Record<MuscleGroup, number>>
}

export const PushPullBalanceView = ({ volumeByMuscle }: PushPullBalanceViewProps) => {
  const { t } = useTranslation()
  const dataColors = useDataColors()

  const categoryColor: Record<PushPullCategory, string> = {
    push: dataColors.chest,
    pull: dataColors.back,
    legs: dataColors.legs,
  }

  const volume: Record<PushPullCategory, number> = { push: 0, pull: 0, legs: 0 }
  for (const [muscle, vol] of Object.entries(volumeByMuscle) as [MuscleGroup, number][]) {
    if (muscle === 'pecho' || muscle === 'triceps' || muscle === 'hombro') volume.push += vol
    else if (
      muscle === 'espalda' ||
      muscle === 'biceps' ||
      muscle === 'trapecios' ||
      muscle === 'antebrazo'
    )
      volume.pull += vol
    else volume.legs += vol
  }

  const percentages = calculatePushPullPercentages(volume)
  const { balanced, alert } = detectImbalance(percentages)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {balanced ? (
          <CheckCircle className="size-4 text-success" aria-hidden />
        ) : (
          <AlertTriangle className="size-4 text-warning" aria-hidden />
        )}
        <p className="kicker">{t('pushpull.title')}</p>
        <InfoTip id="pushPull" values={{ pct: PUSH_PULL_ALERT_PCT }} />
      </div>

      {alert && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-warning" aria-hidden />
            <p className="text-xs font-medium text-warning">
              {t('pushpull.imbalance')}: {alert}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col">
        {(['push', 'pull', 'legs'] as PushPullCategory[]).map((cat) => (
          <div key={cat} className="border-t border-border/40 py-2 first:border-t-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-fg">{t(`pushpull.${cat}` as any)}</p>
              <p className="text-xs text-muted">{percentages[cat].toFixed(0)}%</p>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-fg/10">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${percentages[cat]}%`, backgroundColor: categoryColor[cat] }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
