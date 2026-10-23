// SkinfoldChart: evolución de % grasa con ChartCard, stats, RangeSlider y trend badge.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { XAxis, YAxis, CartesianGrid, Area } from 'recharts'
import { AnimatedAreaChart } from '@/components/stats/AnimatedCharts'
import { ChartCard } from '@/components/stats/ChartCard'
import { ChartTooltip } from '@/components/stats/ChartTooltip'
import { RangePills } from '@/components/stats/RangePills'
import { StatRow, type StatItem } from '@/components/stats/StatRow'
import { TrendBadge } from '@/components/stats/TrendBadge'
import { DrillDownPanel, type DrillDownData } from '@/components/stats/DrillDownPanel'
import { useThemeColors } from '@/hooks/useThemeColors'
import { useDataColors } from '@/hooks/useDataColors'
import { axisTick } from '@/components/stats/chartStyle'
import { calcJacksonPollock } from '@/domain/calculators/bodyComposition'
import { inRange, type StatsRange } from '@/domain/dates'
import { formatDayShort } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { SkinfoldEntry } from '@/domain/types'


type Props = {
  entries: SkinfoldEntry[]
}

export const SkinfoldChart = ({ entries }: Props) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const colors = useThemeColors()
  const dataColors = useDataColors()
  const [range, setRange] = useState<StatsRange>(30)
  const [drillDown, setDrillDown] = useState<DrillDownData | null>(null)

  const { data, stats, trendPct } = useMemo(() => {
    const filtered = entries
      .map((e) => {
        const r7 = calcJacksonPollock({ sites: e.sites, sex: e.sex, age: e.age }, '7')
        const r3 = calcJacksonPollock({ sites: e.sites, sex: e.sex, age: e.age }, '3')
        const pct = r7.bodyFatPct ?? r3.bodyFatPct
        return {
          date: formatDayShort(e.localDate, lang),
          rawDate: e.localDate,
          pct,
          keep: pct != null && inRange(e.localDate, range),
        }
      })
      .filter((d) => d.keep)

    const current = filtered.length > 0 ? (filtered[filtered.length - 1].pct ?? 0) : 0
    const previous = filtered.length > 1 ? (filtered[0].pct ?? 0) : current
    const change = previous !== 0 ? ((current - previous) / previous) * 100 : 0

    return {
      data: filtered,
      stats: [
        { value: current, label: t('stats.grasaCorporal'), format: 'decimal' as const, suffix: ' %' },
      ] satisfies StatItem[],
      trendPct: change,
    }
  }, [entries, range, lang, t])

  if (data.length === 0) {
    return (
      <ChartCard title={t('stats.grasaAria')} help="grasa">
        <p className="py-4 text-center text-sm text-muted">
          {entries.length === 0 ? t('stats.grasaSinDatos') : t('stats.sinRango')}
        </p>
      </ChartCard>
    )
  }

  const min = Math.min(...data.map((d) => d.pct as number)) - 1
  const max = Math.max(...data.map((d) => d.pct as number)) + 1

  return (
    <ChartCard
      title={t('stats.grasaCorporal')}
      help="grasa"
      stats={<StatRow stats={stats} />}
      actions={<RangePills value={range} onChange={setRange} />}
      footer={trendPct !== 0 ? <TrendBadge value={trendPct} label={t('stats.period')} /> : undefined}
    >
      <AnimatedAreaChart data={data} height={220} label={t('stats.grasaAria')} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="skinfoldGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={dataColors.fat} stopOpacity={0.3} />
            <stop offset="95%" stopColor={dataColors.fat} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tick={axisTick(colors)} axisLine={false} tickLine={false} minTickGap={12} interval="preserveStartEnd" />
        <YAxis domain={[min, max]} tick={axisTick(colors)} axisLine={false} tickLine={false} width={36} />
        <ChartTooltip colors={colors} formatter={(value) => [`${value} %`, t('stats.grasaCorporal')]} />
        <Area type="monotone" dataKey="pct" stroke={dataColors.fat} strokeWidth={2.5} fill="url(#skinfoldGradient)" dot={{ r: 4, fill: dataColors.fat, strokeWidth: 0 }} activeDot={{ r: 6, fill: dataColors.fat, strokeWidth: 0, style: { outline: 'none' } }} />
      </AnimatedAreaChart>
      <DrillDownPanel data={drillDown} onClose={() => setDrillDown(null)} />
    </ChartCard>
  )
}
