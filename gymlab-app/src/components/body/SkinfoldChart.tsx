// SkinfoldChart: evolución de % grasa con ChartCard, stats, RangeSlider y trend badge.
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
import { axisTick, tooltipStyle } from '@/components/stats/chartStyle'
import { calcJacksonPollock } from '@/domain/calculators/bodyComposition'
import { inRange, type StatsRange } from '@/domain/dates'
import { formatDayShort } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { SkinfoldEntry } from '@/domain/types'

const RANGES = [
  { value: 30, label: '30 d' },
  { value: 90, label: '90 d' },
  { value: 0, label: 'Todo' },
]

type Props = {
  entries: SkinfoldEntry[]
}

export const SkinfoldChart = ({ entries }: Props) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const colors = useThemeColors()
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
      <ChartCard title={t('stats.grasaAria')}>
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
      title={t('stats.grasaAria')}
      stats={<StatRow stats={stats} />}
      actions={<RangeSlider options={RANGES} value={range} onChange={(v) => setRange(v as StatsRange)} />}
      footer={trendPct !== 0 ? <TrendBadge value={trendPct} label="periodo" /> : undefined}
    >
      <AnimatedAreaChart data={data} height={220} label={t('stats.grasaAria')} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="skinfoldGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.gold} stopOpacity={0.3} />
            <stop offset="95%" stopColor={colors.gold} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tick={axisTick(colors)} axisLine={false} tickLine={false} minTickGap={12} interval="preserveStartEnd" />
        <YAxis domain={[min, max]} tick={axisTick(colors)} axisLine={false} tickLine={false} width={36} />
        <Tooltip contentStyle={tooltipStyle(colors)} labelStyle={{ color: colors.muted }} itemStyle={{ color: colors.fg }} formatter={(value) => [`${value} %`, t('stats.grasaCorporal')]} />
        <Area type="monotone" dataKey="pct" stroke={colors.gold} strokeWidth={2.5} fill="url(#skinfoldGradient)" dot={{ r: 4, fill: colors.gold, strokeWidth: 0 }} activeDot={{ r: 6, fill: colors.cta, strokeWidth: 0 }} />
      </AnimatedAreaChart>
      <DrillDownPanel data={drillDown} onClose={() => setDrillDown(null)} />
    </ChartCard>
  )
}
