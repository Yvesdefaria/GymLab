// Frecuencia muscular vs objetivo: filas hairline y barras finas con el color
// categórico del grupo. El verde solo aparece como check de “sin desbalance”.
import { useTranslation } from 'react-i18next'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { InfoTip } from '@/components/ui/InfoTip'
import { useDataColors } from '@/hooks/useDataColors'
import { muscleColor } from '@/components/stats/muscleColors'
import { FREQUENCY_ALERT_PCT, compareFrequency, getImbalancedGroups } from '@/domain/muscleFrequency'
import type { MuscleGroup as MG } from '@/domain/types'

interface MuscleFrequencyViewProps {
  frequency: Partial<Record<MG, number>>
}

export const MuscleFrequencyView = ({ frequency }: MuscleFrequencyViewProps) => {
  const { t } = useTranslation()
  const dataColors = useDataColors()
  const comparison = compareFrequency(frequency)
  const imbalanced = getImbalancedGroups(frequency)

  return (
    <div className="flex flex-col gap-3" data-tour="stats-frequency">
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-4 text-accent" aria-hidden />
        <p className="kicker">{t('frequency.title')}</p>
        <InfoTip id="frecuencia" values={{ pct: FREQUENCY_ALERT_PCT }} />
      </div>

      {imbalanced.length > 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-warning" aria-hidden />
            <p className="text-xs font-medium text-warning">{t('frequency.alert')}</p>
          </div>
          <p className="mt-1.5 text-xs text-muted">
            {imbalanced.map((g) => t(`muscle.${g.group}` as any)).join(', ')}
          </p>
        </div>
      )}

      <div className="flex flex-col">
        {comparison.map(({ group, actual, target, alert }) => {
          const pct = target > 0 ? Math.min(100, (actual / target) * 100) : 0
          return (
            <div key={group} className="border-t border-border/40 py-2 first:border-t-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-fg">
                  {t(`muscle.${group}` as any)}
                </p>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-muted">
                    {actual}/{target} {t('frequency.sessions')}
                  </p>
                  {alert ? (
                    <AlertTriangle className="size-4 text-warning" />
                  ) : (
                    <CheckCircle className="size-4 text-success" />
                  )}
                </div>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-fg/10">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: muscleColor(group, dataColors),
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
