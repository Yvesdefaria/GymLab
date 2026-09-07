// Fila de 4 tarjetas resumen del contador de pasos: pasos, distancia, calorías
// y racha. Solo presentación: los cálculos llegan ya hechos desde el hook/dominio.
import { useTranslation } from 'react-i18next'
import { Footprints, Ruler, Flame, CalendarCheck2 } from 'lucide-react'
import type { AppLanguage } from '@/domain/onboarding'
import { formatNumber } from '@/lib/intl'

type StepStatsProps = {
  steps: number
  distanceKm: number
  calories: number
  streak: number
}

const formatDistance = (km: number, lang: AppLanguage): string =>
  formatNumber(km, lang, { maximumFractionDigits: 1 })

export const StepStats = ({ steps, distanceKm, calories, streak }: StepStatsProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage

  const cards = [
    {
      icon: Footprints,
      value: formatNumber(steps, lang),
      label: t('steps.statSteps'),
    },
    {
      icon: Ruler,
      value: `${formatDistance(distanceKm, lang)} ${t('steps.distanceKm')}`,
      label: t('steps.distanceLabel'),
    },
    {
      icon: Flame,
      value: `${formatNumber(Math.round(calories), lang)} ${t('steps.kcal')}`,
      label: t('steps.caloriesLabel'),
    },
    {
      icon: CalendarCheck2,
      value: t('steps.streakDays', { count: streak }),
      label: t('steps.streakLabel'),
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-2">
      {cards.map(({ icon: Icon, value, label }) => (
        <div key={label} className="panel flex flex-col items-start gap-2 rounded-2xl p-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-bg-elevated text-cta">
            <Icon className="size-5" aria-hidden />
          </span>
          <span className="text-base font-bold leading-tight text-fg">{value}</span>
          <span className="text-xs text-muted">{label}</span>
        </div>
      ))}
    </div>
  )
}