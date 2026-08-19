// Balance push/pull/legs: barras de proporción con alertas de desequilibrio.
import { useTranslation } from 'react-i18next'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { calculatePushPullPercentages, detectImbalance, type PushPullCategory } from '@/domain/pushPullBalance'
import type { MuscleGroup } from '@/domain/types'

const categoryColor: Record<PushPullCategory, string> = {
  push: 'bg-blue-400',
  pull: 'bg-accent',
  legs: 'bg-green-400',
}

interface PushPullBalanceViewProps {
  volumeByMuscle: Partial<Record<MuscleGroup, number>>
}

export const PushPullBalanceView = ({ volumeByMuscle }: PushPullBalanceViewProps) => {
  const { t } = useTranslation()

  // Calcula volumen por categoría.
  const volume: Record<PushPullCategory, number> = { push: 0, pull: 0, legs: 0 }
  for (const [muscle, vol] of Object.entries(volumeByMuscle) as [MuscleGroup, number][]) {
    if (muscle === 'pecho' || muscle === 'triceps' || muscle === 'hombro') volume.push += vol
    else if (muscle === 'espalda' || muscle === 'biceps' || muscle === 'trapecios' || muscle === 'antebrazo') volume.pull += vol
    else volume.legs += vol
  }

  const percentages = calculatePushPullPercentages(volume)
  const { balanced, alert } = detectImbalance(percentages)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {balanced ? (
          <CheckCircle className="size-4 text-accent" aria-hidden />
        ) : (
          <AlertTriangle className="size-4 text-orange-400" aria-hidden />
        )}
        <p className="kicker">{t('pushpull.title')}</p>
      </div>

      {/* Alerta */}
      {alert && (
        <div className="rounded-xl border border-orange-400/30 bg-orange-400/10 px-3 py-2">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="size-3 text-orange-400" aria-hidden />
            <p className="text-[0.6rem] font-medium text-orange-400">
              {t('pushpull.imbalance')}: {alert}
            </p>
          </div>
        </div>
      )}

      {/* Barras de proporción */}
      <div className="flex flex-col gap-2">
        {(['push', 'pull', 'legs'] as PushPullCategory[]).map((cat) => (
          <div key={cat} className="rounded-xl border border-border/30 bg-bg-elevated/30 px-3 py-2">
            <div className="flex items-center justify-between">
              <p className="text-[0.65rem] font-medium text-fg">
                {cat === 'push' ? t('pushpull.push') : cat === 'pull' ? t('pushpull.pull') : t('pushpull.legs')}
              </p>
              <p className="text-[0.55rem] text-muted">
                {percentages[cat].toFixed(0)}%
              </p>
            </div>
            <div className="mt-1.5 h-2 w-full rounded-full bg-border/30 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${categoryColor[cat]}`}
                style={{ width: `${percentages[cat]}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
