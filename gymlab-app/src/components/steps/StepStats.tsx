// Fila de 3 stats de /pasos (dirección C): distancia, calorías y racha en
// columnas con separadores hairline. Los pasos ya viven en el héroe; no se
// duplican acá. Solo presentación: los cálculos llegan hechos desde el hook.
import { useTranslation } from 'react-i18next'
import type { AppLanguage } from '@/domain/onboarding'
import { formatNumber } from '@/lib/intl'

type StepStatsProps = {
  distanceKm: number
  calories: number
  streak: number
}

const formatDistance = (km: number, lang: AppLanguage): string =>
  formatNumber(km, lang, { maximumFractionDigits: 1 })

export const StepStats = ({ distanceKm, calories, streak }: StepStatsProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage

  const stats = [
    {
      value: `${formatDistance(distanceKm, lang)} ${t('steps.distanceKm')}`,
      label: t('steps.distanceLabel'),
    },
    {
      value: `${formatNumber(Math.round(calories), lang)} ${t('steps.kcal')}`,
      label: t('steps.caloriesLabel'),
    },
    {
      value: formatNumber(streak, lang),
      label: t('steps.streakLabel'),
    },
  ]

  return (
    <div className="grid grid-cols-3 divide-x divide-border/40 border-t border-border/40 py-3 text-center">
      {stats.map((stat) => (
        <div key={stat.label} className="px-2">
          <strong className="block font-display text-2xl font-light tabular-nums text-fg">
            {stat.value}
          </strong>
          <span className="text-[8px] uppercase tracking-[0.12em] text-muted">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  )
}
