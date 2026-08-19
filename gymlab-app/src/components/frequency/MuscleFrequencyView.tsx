// Frecuencia muscular vs objetivo: barras de frecuencia con alertas de desbalance.
import { useTranslation } from 'react-i18next'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { compareFrequency, getImbalancedGroups } from '@/domain/muscleFrequency'
import type { MuscleGroup as MG } from '@/domain/types'

interface MuscleFrequencyViewProps {
  frequency: Partial<Record<MG, number>>
}

export const MuscleFrequencyView = ({ frequency }: MuscleFrequencyViewProps) => {
  const { t } = useTranslation()
  const comparison = compareFrequency(frequency)
  const imbalanced = getImbalancedGroups(frequency)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-4 text-accent" aria-hidden />
        <p className="kicker">{t('frequency.title')}</p>
      </div>

      {/* Alerta de desbalance */}
      {imbalanced.length > 0 && (
        <div className="rounded-xl border border-orange-400/30 bg-orange-400/10 px-3 py-2">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="size-3 text-orange-400" aria-hidden />
            <p className="text-[0.6rem] font-medium text-orange-400">
              {t('frequency.alert')}
            </p>
          </div>
          <p className="mt-1 text-[0.55rem] text-muted">
            {imbalanced.map((g) => g.group === 'pecho' ? t('muscle.pecho') : g.group === 'espalda' ? t('muscle.espalda') : g.group === 'biceps' ? t('muscle.biceps') : g.group === 'triceps' ? t('muscle.triceps') : g.group === 'hombro' ? t('muscle.hombro') : g.group === 'pierna' ? t('muscle.pierna') : g.group === 'gluteo' ? t('muscle.gluteo') : g.group === 'abdomen' ? t('muscle.abdomen') : g.group === 'trapecios' ? t('muscle.trapecios') : t('muscle.antebrazo')).join(', ')}
          </p>
        </div>
      )}

      {/* Barras de frecuencia */}
      <div className="flex flex-col gap-1.5">
        {comparison.map(({ group, actual, target, alert }) => {
          const pct = target > 0 ? Math.min(100, (actual / target) * 100) : 0
          return (
            <div key={group} className="rounded-xl border border-border/30 bg-bg-elevated/30 px-3 py-2">
              <div className="flex items-center justify-between">
                <p className="text-[0.6rem] font-medium text-fg">
                  {group === 'pecho' ? t('muscle.pecho') : group === 'espalda' ? t('muscle.espalda') : group === 'biceps' ? t('muscle.biceps') : group === 'triceps' ? t('muscle.triceps') : group === 'hombro' ? t('muscle.hombro') : group === 'pierna' ? t('muscle.pierna') : group === 'gluteo' ? t('muscle.gluteo') : group === 'abdomen' ? t('muscle.abdomen') : group === 'trapecios' ? t('muscle.trapecios') : t('muscle.antebrazo')}
                </p>
                <div className="flex items-center gap-1">
                  <p className="text-[0.55rem] text-muted">
                    {actual}/{target} {t('frequency.sessions')}
                  </p>
                  {alert ? (
                    <AlertTriangle className="size-3 text-orange-400" />
                  ) : (
                    <CheckCircle className="size-3 text-accent" />
                  )}
                </div>
              </div>
              {/* Barra */}
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-border/30 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    alert ? 'bg-orange-400' : 'bg-accent'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
