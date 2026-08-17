// BodyWeightChart: evolución del peso con ChartCard, stats animados, comparativa y trend badge.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { XAxis, YAxis, Tooltip, CartesianGrid, Area } from 'recharts'
import { AnimatedAreaChart } from '@/components/stats/AnimatedCharts'
import { ChartCard } from '@/components/stats/ChartCard'
import { RangeSlider } from '@/components/stats/RangeSlider'
import { StatRow, type StatItem } from '@/components/stats/StatRow'
import { TrendBadge } from '@/components/stats/TrendBadge'
import { DrillDownPanel, type DrillDownData } from '@/components/stats/DrillDownPanel'
import { useThemeColors } from '@/hooks/useThemeColors'
import { useSettings } from '@/hooks/useSettings'
import { axisTick, tooltipStyle } from '@/components/stats/chartStyle'
import { applyUnits, formatUnits } from '@/domain/settings'
import { inRange, type StatsRange } from '@/domain/dates'
import { formatDayShort } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { BodyWeightEntry } from '@/domain/types'

const RANGES = [
  { value: 30, label: '30 d' },
  { value: 90, label: '90 d' },
  { value: 0, label: 'Todo' },
]

type Props = {
  entries: BodyWeightEntry[]
}

export const BodyWeightChart = ({ entries }: Props) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const colors = useThemeColors()
  const { settings } = useSettings()
  const [range, setRange] = useState<StatsRange>(30)
  const [drillDown, setDrillDown] = useState<DrillDownData | null>(null)

  const { data, stats, trendPct } = useMemo(() => {
    const filtered = entries
      .filter((e) => inRange(e.localDate, range))
      .map((e) => ({
        date: formatDayShort(e.localDate, lang),
        rawDate: e.localDate,
        peso: Math.round(applyUnits(e.weightKg, settings.units) * 10) / 10,
      }))

    const current = filtered.length > 0 ? filtered[filtered.length - 1].peso : 0
    const previous = filtered.length > 1 ? filtered[0].peso : current
    const change = previous !== 0 ? ((current - previous) / previous) * 100 : 0

    return {
      data: filtered,
      stats: [
        { value: current, label: t('perfil.pesoChartLabel'), format: 'decimal' as const, suffix: ` ${formatUnits(settings.units)}` },
      ] satisfies StatItem[],
      trendPct: change,
    }
  }, [entries, range, settings.units, lang, t])

  if (data.length === 0) {
    return (
      <ChartCard title={t('perfil.pesoChartLabel')}>
        <p className="py-4 text-center text-sm text-muted">
          {entries.length === 0 ? t('perfil.pesoSinDatos') : t('perfil.pesoSinRango')}
        </p>
      </ChartCard>
    )
  }

  const min = Math.min(...data.map((d) => d.peso)) - 1
  const max = Math.max(...data.map((d) => d.peso)) + 1

  return (
    <ChartCard
      title={t('perfil.pesoChartLabel')}
      stats={<StatRow stats={stats} />}
      actions={<RangeSlider options={RANGES} value={range} onChange={(v) => setRange(v as StatsRange)} />}
      footer={trendPct !== 0 ? <TrendBadge value={trendPct} label="periodo" /> : undefined}
    >
      <AnimatedAreaChart data={data} height={220} label={t('perfil.pesoChartLabel')} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.gold} stopOpacity={0.3} />
            <stop offset="95%" stopColor={colors.gold} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tick={axisTick(colors)} axisLine={false} tickLine={false} minTickGap={12} interval="preserveStartEnd" />
        <YAxis domain={[min, max]} tick={axisTick(colors)} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}${formatUnits(settings.units)}`} width={36} />
        <Tooltip
          contentStyle={tooltipStyle(colors)}
          labelStyle={{ color: colors.muted }}
          itemStyle={{ color: colors.fg }}
          formatter={(value) => [`${value} ${formatUnits(settings.units)}`, t('perfil.pesoSeries')]}
        />
        <Area
          type="monotone"
          dataKey="peso"
          stroke={colors.gold}
          strokeWidth={2.5}
          fill="url(#weightGradient)"
          dot={{ r: 4, fill: colors.gold, strokeWidth: 0 }}
          activeDot={{ r: 6, fill: colors.cta, strokeWidth: 0, style: { outline: 'none' } }}
          onClick={(d) => {
            const payload = d as unknown as { peso: number; date: string }
            setDrillDown({
              title: payload.date,
              subtitle: t('perfil.pesoChartLabel'),
              metrics: [{ label: t('perfil.pesoChartLabel'), value: `${payload.peso} ${formatUnits(settings.units)}` }],
            })
          }}
        />
      </AnimatedAreaChart>
      <DrillDownPanel data={drillDown} onClose={() => setDrillDown(null)} />
    </ChartCard>
  )
}
