// CompositionDonut: composición corporal desglosada en grasa, hueso, músculo y resto.
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

const COMP_COLORS = ['#D44040', '#7EB8DA', '#4ADE80', '#A78BFA'] as const

type Props = {
  point: BodyCompPoint
}

export const CompositionDonut = ({ point }: Props) => {
  const { t } = useTranslation()
  const colors = useThemeColors()
  const { settings } = useSettings()

  const fatMass = Math.round(applyUnits(point.fatMassKg ?? 0, settings.units) * 10) / 10
  const boneMass = Math.round(applyUnits(point.boneMassKg ?? 0, settings.units) * 10) / 10
  const muscleMass = Math.round(applyUnits(point.muscleMassKg ?? 0, settings.units) * 10) / 10
  const total = Math.round(applyUnits((point.fatMassKg ?? 0) + (point.boneMassKg ?? 0) + (point.muscleMassKg ?? 0), settings.units) * 10) / 10
  const otherMass = Math.max(0, Math.round((total - fatMass - boneMass - muscleMass) * 10) / 10)
  const bodyFatPct = point.bodyFatPct ?? 0

  const data = useMemo(() => [
    { name: t('stats.masaGrasa'), value: fatMass },
    { name: t('stats.masaHueso'), value: boneMass },
    { name: t('stats.masaMuscular'), value: muscleMass },
    { name: t('stats.masaResto'), value: otherMass },
  ], [fatMass, boneMass, muscleMass, otherMass, t])

  const stats = useMemo((): StatItem[] => [
    { value: bodyFatPct, label: t('stats.pctGrasa'), format: 'decimal' as const, suffix: ' %' },
    { value: muscleMass, label: t('stats.masaMuscular'), format: 'decimal' as const, suffix: ` ${formatUnits(settings.units)}` },
  ], [bodyFatPct, muscleMass, settings.units, t])

  return (
    <ChartCard
      title={t('stats.composicionCorporal')}
      stats={<StatRow stats={stats} />}
    >
      <div
        className="relative"
        role="img"
        aria-label={`${fatMass} grasa, ${boneMass} hueso, ${muscleMass} músculo`}
      >
        <AnimatedDonut width="100%" height={CHART_HEIGHTS.donut}>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={54} outerRadius={80} paddingAngle={1.5} stroke="none">
            {data.map((_, i) => (
              <Cell key={i} fill={COMP_COLORS[i]} />
            ))}
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

      <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2 text-muted">
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: COMP_COLORS[i] }} aria-hidden />
            <span className="truncate">{d.name}</span>
            <span className="ml-auto tabular-nums text-fg">{d.value}</span>
          </li>
        ))}
      </ul>
    </ChartCard>
  )
}
