// Dona con la composición corporal actual: masa grasa vs magra, % de grasa en el centro y leyenda (animada).
import { useTranslation } from 'react-i18next'
import { Pie, Cell, Tooltip } from 'recharts'
import { AnimatedDonut } from './AnimatedCharts'
import { useThemeColors } from '@/hooks/useThemeColors'
import { tooltipStyle } from './chartStyle'
import { useSettings } from '@/hooks/useSettings'
import { applyUnits, formatUnits } from '@/domain/settings'
import type { BodyCompPoint } from '@/domain/calculators/bodyComposition'

type Props = {
  point: BodyCompPoint
}

export const CompositionDonut = ({ point }: Props) => {
  const { t } = useTranslation()
  const colors = useThemeColors()
  const { settings } = useSettings()

  const fatMass = point.fatMassKg != null ? Math.round(applyUnits(point.fatMassKg, settings.units) * 10) / 10 : null
  const fatFreeMass = point.fatFreeMassKg != null ? Math.round(applyUnits(point.fatFreeMassKg, settings.units) * 10) / 10 : null
  const total = fatMass != null && fatFreeMass != null ? fatMass + fatFreeMass : null

  const data = [
    { name: t('stats.masaGrasa'), value: fatMass ?? 0 },
    { name: t('stats.masaMagra'), value: fatFreeMass ?? 0 },
  ]

  const pct = point.bodyFatPct != null ? `${point.bodyFatPct}%` : '—'

  return (
    <div>
      <div
        className="relative"
        role="img"
        aria-label={t('stats.compDonutAria', {
          grasa: data[0].value,
          unidad: formatUnits(settings.units),
          magra: data[1].value,
          pct,
        })}
      >
        <AnimatedDonut width="100%" height={200}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={56}
            outerRadius={82}
            paddingAngle={2}
            stroke="none"
          >
            <Cell fill={colors.danger} />
            <Cell fill={colors.success} />
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle(colors)}
            labelStyle={{ color: colors.muted }}
            itemStyle={{ color: colors.fg }}
            formatter={(value) => [`${value} ${formatUnits(settings.units)}`]}
          />
        </AnimatedDonut>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[0.65rem] uppercase tracking-wide text-muted">{t('stats.pctGrasa')}</p>
          <p className="font-display text-xl font-semibold text-fg">{pct}</p>
        </div>
      </div>
      {total != null && (
        <ul className="mt-2 space-y-1 text-sm">
          <li className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: colors.danger }} aria-hidden />
              {t('stats.masaGrasa')}
            </span>
            <span className="font-medium text-fg">
              {fatMass} {formatUnits(settings.units)} ({point.bodyFatPct}%)
            </span>
          </li>
          <li className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: colors.success }} aria-hidden />
              {t('stats.masaMagra')}
            </span>
            <span className="font-medium text-fg">
              {fatFreeMass} {formatUnits(settings.units)} (
              {total > 0 ? Math.round((1 - (fatMass ?? 0) / total) * 100) : 0}%)
            </span>
          </li>
        </ul>
      )}
    </div>
  )
}
