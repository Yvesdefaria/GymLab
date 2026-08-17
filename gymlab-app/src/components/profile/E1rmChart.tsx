// E1rmChart: evolución 1RM estimado con ChartCard, stats y PR marker.
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { XAxis, YAxis, Tooltip, CartesianGrid, Area, ReferenceDot } from 'recharts'
import { AnimatedAreaChart } from '@/components/stats/AnimatedCharts'
import { ChartCard } from '@/components/stats/ChartCard'
import { StatRow, type StatItem } from '@/components/stats/StatRow'
import { TrendBadge } from '@/components/stats/TrendBadge'
import { useThemeColors } from '@/hooks/useThemeColors'
import { useSettings } from '@/hooks/useSettings'
import { tooltipStyle, axisTick } from '@/components/stats/chartStyle'
import { applyUnits, formatUnits } from '@/domain/settings'
import { formatDate } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { E1rmPoint } from '@/domain/e1rm'

type E1rmChartProps = {
  points: E1rmPoint[]
}

export const E1rmChart = ({ points }: E1rmChartProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const colors = useThemeColors()
  const { settings } = useSettings()

  const data = useMemo(
    () =>
      points.map((p) => ({
        ...p,
        label: formatDate(p.date, lang, { day: 'numeric', month: 'short' }),
        displayValue: Math.round(applyUnits(p.estimated1RM, settings.units)),
      })),
    [points, lang, settings.units],
  )

  const stats = useMemo((): StatItem[] => {
    if (data.length === 0) return []
    const current = data[data.length - 1].displayValue
    return [
      { value: current, label: '1RM', format: 'decimal' as const, suffix: ` ${formatUnits(settings.units)}` },
    ]
  }, [data, settings.units, t])

  const trendPct = useMemo(() => {
    if (data.length < 2) return 0
    const first = data[0].displayValue
    const last = data[data.length - 1].displayValue
    return first !== 0 ? ((last - first) / first) * 100 : 0
  }, [data])

  if (data.length === 0) {
    return (
      <ChartCard title={t('stats.fuerzaEstimada')}>
        <p className="py-4 text-center text-sm text-muted">{t('stats.sinSeries1rm')}</p>
      </ChartCard>
    )
  }

  return (
    <ChartCard
      title={t('stats.fuerzaEstimada')}
      stats={<StatRow stats={stats} />}
      footer={trendPct !== 0 ? <TrendBadge value={trendPct} label="total" /> : undefined}
    >
      <AnimatedAreaChart data={data} height={220} label={t('perfil.e1rmChartLabel')} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="e1rmGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.gold} stopOpacity={0.3} />
            <stop offset="95%" stopColor={colors.gold} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={axisTick(colors)} axisLine={false} tickLine={false} minTickGap={12} interval="preserveStartEnd" />
        <YAxis tick={axisTick(colors)} axisLine={false} tickLine={false} tickFormatter={(v) => String(Math.round(applyUnits(Number(v), settings.units)))} width={36} />
        <Tooltip
          contentStyle={tooltipStyle(colors)}
          labelStyle={{ color: colors.muted }}
          itemStyle={{ color: colors.fg }}
          formatter={(value) => [`${Math.round(applyUnits(Number(value), settings.units))} ${formatUnits(settings.units)}`, t('perfil.e1rmSeries')]}
        />
        <Area type="monotone" dataKey="estimated1RM" stroke={colors.gold} strokeWidth={2.5} fill="url(#e1rmGradient)" dot={{ r: 4, fill: colors.gold, strokeWidth: 0 }} activeDot={{ r: 6, fill: colors.cta, strokeWidth: 0 }} />
        <ReferenceDot x={data[data.length - 1].label} y={data[data.length - 1].estimated1RM} r={5} fill={colors.cta} stroke="none" />
      </AnimatedAreaChart>
    </ChartCard>
  )
}
