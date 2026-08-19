// ImcChart: evolución IMC con ChartCard, stats, zonas de riesgo y trend.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { XAxis, YAxis, Tooltip, CartesianGrid, Area, ReferenceArea } from 'recharts'
import { AnimatedAreaChart } from './AnimatedCharts'
import { ChartCard } from './ChartCard'
import { RangeSlider } from './RangeSlider'
import { StatRow, type StatItem } from './StatRow'
import { useThemeColors } from '@/hooks/useThemeColors'
import { axisTick, tooltipStyle } from './chartStyle'
import { inRange, type StatsRange } from '@/domain/dates'
import { formatDayShort } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { ImcPoint } from '@/domain/calculators/bodyComposition'

const RANGES = [
  { value: 30, label: '30 d' },
  { value: 90, label: '90 d' },
  { value: 0, label: 'Todo' },
]

type Props = {
  points: ImcPoint[]
}

export const ImcChart = ({ points }: Props) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const colors = useThemeColors()
  const [range, setRange] = useState<StatsRange>(30)

  const data = useMemo(() => {
    return points
      .filter((p) => inRange(p.date, range))
      .map((p) => ({
        date: formatDayShort(p.date, lang),
        imc: Math.round(p.imc * 10) / 10,
      }))
  }, [points, range, lang])

  const stats = useMemo((): StatItem[] => {
    const last = data.length > 0 ? data[data.length - 1] : null
    if (!last) return []
    return [
      { value: last.imc, label: 'IMC', format: 'decimal' },
    ]
  }, [data])

  if (data.length === 0) {
    return (
      <ChartCard title={t('stats.imcTitulo')}>
        <p className="py-4 text-center text-sm text-muted">{t('stats.imcSinDatos')}</p>
      </ChartCard>
    )
  }

  const min = Math.min(...data.map((d) => d.imc)) - 1
  const max = Math.max(...data.map((d) => d.imc)) + 1

  return (
    <ChartCard
      title={t('stats.imcTitulo')}
      stats={<StatRow stats={stats} />}
      actions={<RangeSlider options={RANGES} value={range} onChange={(v) => setRange(v as StatsRange)} />}
    >
      <AnimatedAreaChart data={data} height={220} label={t('stats.imcAria')} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="imcGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.gold} stopOpacity={0.3} />
            <stop offset="95%" stopColor={colors.gold} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
        {/* Health zone reference areas */}
        {min < 25 && max > 18.5 && (
          <ReferenceArea y1={18.5} y2={25} fill={colors.success} fillOpacity={0.05} />
        )}
        <XAxis dataKey="date" tick={axisTick(colors)} axisLine={false} tickLine={false} minTickGap={12} interval="preserveStartEnd" />
        <YAxis domain={[min, max]} tick={axisTick(colors)} axisLine={false} tickLine={false} width={36} />
        <Tooltip contentStyle={tooltipStyle(colors)} labelStyle={{ color: colors.muted }} itemStyle={{ color: colors.fg }} formatter={(value) => [value, t('stats.imcTooltip')]} />
        <Area type="monotone" dataKey="imc" stroke={colors.gold} strokeWidth={2.5} fill="url(#imcGradient)" dot={{ r: 4, fill: colors.gold, strokeWidth: 0 }} activeDot={{ r: 6, fill: colors.cta, strokeWidth: 0, style: { outline: 'none' } }} />
      </AnimatedAreaChart>
    </ChartCard>
  )
}
