// RatiosChart: WHtR y WHR con ChartCard, stats, umbral de riesgo y trend.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { XAxis, YAxis, Tooltip, CartesianGrid, Area, Legend, ReferenceLine } from 'recharts'
import { AnimatedAreaChart } from './AnimatedCharts'
import { ChartCard } from './ChartCard'
import { RangeSlider } from './RangeSlider'
import { StatRow, type StatItem } from './StatRow'
import { useThemeColors } from '@/hooks/useThemeColors'
import { axisTick, tooltipStyle } from './chartStyle'
import { inRange, type StatsRange } from '@/domain/dates'
import { formatDayShort } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { RatiosPoint } from '@/domain/calculators/bodyComposition'
import type { Sex } from '@/domain/types'

const RANGES = [
  { value: 30, label: '30 d' },
  { value: 90, label: '90 d' },
  { value: 0, label: 'Todo' },
]

type Props = {
  points: RatiosPoint[]
  sex: Sex
}

export const RatiosChart = ({ points, sex }: Props) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const colors = useThemeColors()
  const [range, setRange] = useState<StatsRange>(30)

  const data = useMemo(() => {
    return points
      .filter((p) => inRange(p.date, range) && (p.whtr != null || p.whr != null))
      .map((p) => ({
        date: formatDayShort(p.date, lang),
        whtr: p.whtr != null ? Math.round(p.whtr * 1000) / 1000 : null,
        whr: p.whr != null ? Math.round(p.whr * 1000) / 1000 : null,
      }))
  }, [points, range, lang])

  const stats = useMemo((): StatItem[] => {
    const last = data.length > 0 ? data[data.length - 1] : null
    if (!last) return []
    const items: StatItem[] = []
    if (last.whtr != null && last.whtr > 0) items.push({ value: last.whtr, label: t('stats.whtrNombre'), format: 'decimal' })
    if (last.whr != null && last.whr > 0) items.push({ value: last.whr, label: t('stats.whrNombre'), format: 'decimal' })
    return items
  }, [data, t])

  const whrLimit = sex === 'male' ? 0.9 : 0.8

  if (data.length === 0) {
    return (
      <ChartCard title={t('stats.ratiosTitulo')}>
        <p className="py-4 text-center text-sm text-muted">{t('stats.ratiosSinDatos')}</p>
      </ChartCard>
    )
  }

  return (
    <ChartCard
      title={t('stats.ratiosTitulo')}
      stats={<StatRow stats={stats} />}
      actions={<RangeSlider options={RANGES} value={range} onChange={(v) => setRange(v as StatsRange)} />}
    >
      <AnimatedAreaChart data={data} height={220} label={t('stats.ratiosAria')} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="whtrGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.gold} stopOpacity={0.3} />
            <stop offset="95%" stopColor={colors.gold} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="whrGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.cta} stopOpacity={0.3} />
            <stop offset="95%" stopColor={colors.cta} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
        <ReferenceLine y={0.5} stroke={colors.danger} strokeDasharray="6 4" strokeWidth={1} label={{ value: '0.5', position: 'right', fill: colors.danger, fontSize: 10 }} />
        <ReferenceLine y={whrLimit} stroke={colors.muted} strokeDasharray="3 3" strokeWidth={1} />
        <XAxis dataKey="date" tick={axisTick(colors)} axisLine={false} tickLine={false} minTickGap={12} interval="preserveStartEnd" />
        <YAxis tick={axisTick(colors)} axisLine={false} tickLine={false} width={36} domain={[0, 'auto']} />
        <Tooltip contentStyle={tooltipStyle(colors)} labelStyle={{ color: colors.muted }} itemStyle={{ color: colors.fg }} />
        <Legend />
        <Area type="monotone" dataKey="whtr" stroke={colors.gold} strokeWidth={2} fill="url(#whtrGradient)" dot={{ r: 3, fill: colors.gold, strokeWidth: 0 }} activeDot={{ r: 5, fill: colors.gold, strokeWidth: 0, style: { outline: 'none' } }} name={t('stats.whtrNombre')} />
        <Area type="monotone" dataKey="whr" stroke={colors.cta} strokeWidth={2} fill="url(#whrGradient)" dot={{ r: 3, fill: colors.cta, strokeWidth: 0 }} activeDot={{ r: 5, fill: colors.cta, strokeWidth: 0, style: { outline: 'none' } }} name={t('stats.whrNombre')} />
      </AnimatedAreaChart>
    </ChartCard>
  )
}
