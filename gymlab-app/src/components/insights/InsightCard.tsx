// Tarjeta de insight semanal sobre la tendencia del volumen de entrenamiento.
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { WeeklyVolumeInsight } from '@/domain/insights'
import { formatVolume } from '@/domain/volume'
import { InfoTip } from '@/components/ui/InfoTip'

type InsightCardProps = {
  insight: WeeklyVolumeInsight
  units: string
}

// Muestra un mensaje según el tono del insight: alza, descenso o estabilidad.
export const InsightCard = ({ insight, units }: InsightCardProps) => {
  const { t } = useTranslation()
  const pct = Math.round(Math.abs(insight.deltaPct))

  if (insight.tone === 'positive') {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-success/40 bg-success/10 p-4">
        <TrendingUp className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-display text-sm font-semibold text-fg">
              {t('insights.volumenAlza')}
            </p>
            <InfoTip label={t('insights.alzaTipLabel')}>
              {t('insights.alzaTipCuerpo')}
            </InfoTip>
          </div>
          <p className="mt-1 text-xs text-muted">
            {t('insights.alzaCuerpo', {
              pct,
              volumen: formatVolume(insight.currentWeekVolume),
              unidades: units,
            })}
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
            <p className="font-display text-sm font-semibold text-fg">{t('insights.volumenDescenso')}</p>
            <InfoTip label={t('insights.descensoTipLabel')}>
              {t('insights.descensoTipCuerpo')}
            </InfoTip>
          </div>
          <p className="mt-1 text-xs text-muted">
            {t('insights.descensoCuerpo', {
              pct,
              volumen: formatVolume(insight.currentWeekVolume),
              unidades: units,
            })}
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
          <p className="font-display text-sm font-semibold text-fg">{t('insights.volumenEstable')}</p>
          <InfoTip label={t('insights.estableTipLabel')}>
            {t('insights.estableTipCuerpo')}
          </InfoTip>
        </div>
        <p className="mt-1 text-xs text-muted">
          {t('insights.estableCuerpo', {
            volumen: formatVolume(insight.currentWeekVolume),
            unidades: units,
          })}
        </p>
      </div>
    </div>
  )
}
