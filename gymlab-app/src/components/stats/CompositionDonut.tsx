// CompositionDonut: composición corporal actual con ChartCard, centro animado y leyenda.
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Pie, Cell, Tooltip } from 'recharts'
import { AnimatedDonut } from './AnimatedCharts'
import { ChartCard } from './ChartCard'
import { StatRow, type StatItem } from './StatRow'
import { useThemeColors } from '@/hooks/useThemeColors'
import { useSettings } from '@/hooks/useSettings'
import { tooltipStyle } from './chartStyle'
import { CHART_HEIGHTS } from '@/domain/chartTokens'
import { applyUnits, formatUnits } from '@/domain/settings'
import type { BodyCompPoint } from '@/domain/calculators/bodyComposition'

type Props = {
  point: BodyCompPoint
}

export const CompositionDonut = ({ point }: Props) => {
  const { t } = useTranslation()
  const colors = useThemeColors()
  const { settings } = useSettings()

  const fatMass = Math.round(applyUnits(point.fatMassKg ?? 0, settings.units) * 10) / 10
  const leanMass = Math.round(applyUnits(point.fatFreeMassKg ?? 0, settings.units) * 10) / 10
  const bodyFatPct = point.bodyFatPct ?? 0

  const data = useMemo(() => [
    { name: t('stats.masaGrasa'), value: fatMass },
    { name: t('stats.masaMagra'), value: leanMass },
  ], [fatMass, leanMass, t])

  const stats = useMemo((): StatItem[] => [
    { value: bodyFatPct, label: t('stats.pctGrasa'), format: 'decimal' as const, suffix: ' %' },
    { value: fatMass, label: t('stats.masaGrasa'), format: 'decimal' as const, suffix: ` ${formatUnits(settings.units)}` },
    { value: leanMass, label: t('stats.masaMagra'), format: 'decimal' as const, suffix: ` ${formatUnits(settings.units)}` },
  ], [bodyFatPct, fatMass, leanMass, settings.units, t])

  return (
    <ChartCard
      title={t('stats.composicionCorporal')}
      stats={<StatRow stats={stats} />}
    >
      <div
        className="relative"
        role="img"
        aria-label={t('stats.compDonutAria', {
          grasa: fatMass,
          magra: leanMass,
          unidad: formatUnits(settings.units),
          pct: bodyFatPct,
        })}
      >
        <AnimatedDonut width="100%" height={CHART_HEIGHTS.donut}>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={54} outerRadius={80} paddingAngle={2} stroke="none">
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
          <p className="font-display text-lg font-semibold text-fg">{bodyFatPct.toFixed(1)}%</p>
        </div>
      </div>

      <ul className="mt-2 flex justify-center gap-4 text-sm">
        <li className="flex items-center gap-2 text-muted">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: colors.danger }} aria-hidden />
          {t('stats.masaGrasa')} {fatMass} {formatUnits(settings.units)}
        </li>
        <li className="flex items-center gap-2 text-muted">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: colors.success }} aria-hidden />
          {t('stats.masaMagra')} {leanMass} {formatUnits(settings.units)}
        </li>
      </ul>
    </ChartCard>
  )
}
