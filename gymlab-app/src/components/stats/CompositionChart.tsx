// CompositionChart: evolución masa grasa vs magra con ChartCard, stats, legend interactiva y trend.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { XAxis, YAxis, Tooltip, CartesianGrid, Area, Legend } from 'recharts'
import { AnimatedAreaChart } from '@/components/stats/AnimatedCharts'
import { ChartCard } from '@/components/stats/ChartCard'
import { RangeSlider } from '@/components/stats/RangeSlider'
import { StatRow, type StatItem } from '@/components/stats/StatRow'
import { useThemeColors } from '@/hooks/useThemeColors'
import { useSettings } from '@/hooks/useSettings'
import { axisTick, tooltipStyle } from '@/components/stats/chartStyle'
import { applyUnits, formatUnits } from '@/domain/settings'
import { inRange, type StatsRange } from '@/domain/dates'
import { formatDayShort } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { BodyCompPoint } from '@/domain/calculators/bodyComposition'

const RANGES = [
  { value: 30, label: '30 d' },
  { value: 90, label: '90 d' },
  { value: 0, label: 'Todo' },
]

type Props = {
  points: BodyCompPoint[]
}

export const CompositionChart = ({ points }: Props) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const colors = useThemeColors()
  const { settings } = useSettings()
  const [range, setRange] = useState<StatsRange>(30)

  const data = useMemo(() => {
    return points
      .filter((p) => inRange(p.date, range))
      .map((p) => ({
        date: formatDayShort(p.date, lang),
        grasa: Math.round(applyUnits(p.fatMassKg ?? 0, settings.units) * 10) / 10,
        magra: Math.round(applyUnits(p.fatFreeMassKg ?? 0, settings.units) * 10) / 10,
      }))
  }, [points, range, settings.units, lang])

  const stats = useMemo((): StatItem[] => {
    const last = data.length > 0 ? data[data.length - 1] : null
    return last
      ? [
          { value: last.grasa, label: t('stats.masaGrasa'), format: 'decimal' as const, suffix: ` ${formatUnits(settings.units)}` },
          { value: last.magra, label: t('stats.masaMagra'), format: 'decimal' as const, suffix: ` ${formatUnits(settings.units)}` },
        ]
      : []
  }, [data, settings.units, t])

  if (data.length === 0) {
    return (
      <ChartCard title={t('stats.composicionCorporal')}>
        <p className="py-4 text-center text-sm text-muted">{t('stats.compSinDatos')}</p>
      </ChartCard>
    )
  }

  return (
    <ChartCard
      title={t('stats.composicionCorporal')}
      stats={<StatRow stats={stats} />}
      actions={<RangeSlider options={RANGES} value={range} onChange={(v) => setRange(v as StatsRange)} />}
    >
      <AnimatedAreaChart data={data} height={220} label={t('stats.compAria')} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="fatGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.danger} stopOpacity={0.3} />
            <stop offset="95%" stopColor={colors.danger} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="leanGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.success} stopOpacity={0.3} />
            <stop offset="95%" stopColor={colors.success} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tick={axisTick(colors)} axisLine={false} tickLine={false} minTickGap={12} interval="preserveStartEnd" />
        <YAxis tick={axisTick(colors)} axisLine={false} tickLine={false} width={36} />
        <Tooltip contentStyle={tooltipStyle(colors)} labelStyle={{ color: colors.muted }} itemStyle={{ color: colors.fg }} formatter={(value, name) => [`${value} ${formatUnits(settings.units)}`, name === 'grasa' ? t('stats.masaGrasa') : t('stats.masaMagra')]} />
        <Legend />
        <Area type="monotone" dataKey="grasa" stroke={colors.danger} strokeWidth={2} fill="url(#fatGradient)" dot={{ r: 3, fill: colors.danger, strokeWidth: 0 }} name={t('stats.masaGrasa')} />
        <Area type="monotone" dataKey="magra" stroke={colors.success} strokeWidth={2} fill="url(#leanGradient)" dot={{ r: 3, fill: colors.success, strokeWidth: 0 }} name={t('stats.masaMagra')} />
      </AnimatedAreaChart>
    </ChartCard>
  )
}
