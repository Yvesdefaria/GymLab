// VolumeRangeChart: barras de volumen semanal con ChartCard, stats animados, comparativa y goal line.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { XAxis, YAxis, Tooltip, CartesianGrid, Bar, Cell, LabelList, ReferenceLine } from 'recharts'
import { AnimatedBarChart } from './AnimatedCharts'
import { ChartCard } from './ChartCard'
import { StatRow, type StatItem } from './StatRow'
import { TrendBadge } from './TrendBadge'
import { DrillDownPanel, type DrillDownData } from './DrillDownPanel'
import { useThemeColors } from '@/hooks/useThemeColors'
import { useSettings } from '@/hooks/useSettings'
import { axisTick, tooltipStyle } from './chartStyle'
import { formatVolume } from '@/domain/volume'
import { applyUnits, formatUnits } from '@/domain/settings'
import { buildWeeklyVolumeSeries } from '@/domain/trainingStats'
import { formatDayShort } from '@/lib/intl'
import type { Workout } from '@/domain/types'
import type { AppLanguage } from '@/domain/onboarding'

type Props = {
  workouts: Workout[]
}

export const VolumeRangeChart = ({ workouts }: Props) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const colors = useThemeColors()
  const { settings } = useSettings()
  const [drillDown, setDrillDown] = useState<DrillDownData | null>(null)

  const { currentData, previousData, stats, trendPct } = useMemo(() => {
    const series = buildWeeklyVolumeSeries(workouts)
    const raw = series.map((p) => ({
      week: p.week,
      weekLabel: formatDayShort(p.week, lang),
      volume: p.volume,
    }))

    // Split: last 8 weeks current, 8 weeks before that as comparison
    const cutPoint = Math.max(0, raw.length - 8)
    const current = raw.slice(cutPoint)
    const previous = raw.slice(Math.max(0, cutPoint - 8), cutPoint)

    const currentTotal = current.reduce((s, d) => s + d.volume, 0)
    const previousTotal = previous.reduce((s, d) => s + d.volume, 0)
    const avgPerWeek = current.length > 0 ? currentTotal / current.length : 0
    const prevAvgPerWeek = previous.length > 0 ? previousTotal / previous.length : 0
    const trendPct = prevAvgPerWeek > 0 ? ((avgPerWeek - prevAvgPerWeek) / prevAvgPerWeek) * 100 : 0

    return {
      currentData: current,
      previousData: previous,
      stats: [
        { value: currentTotal, label: t('stats.total'), format: 'volume' as const },
        { value: Math.round(avgPerWeek), label: t('stats.mediaSemanal'), format: 'volume' as const },
        { value: current.length, label: t('stats.semanas') },
      ] satisfies StatItem[],
      trendPct,
    }
  }, [workouts, lang, t])

  if (currentData.length === 0) {
    return (
      <ChartCard title={t('stats.rangoVolumen')}>
        <p className="py-4 text-center text-sm text-muted">{t('stats.sinSesiones')}</p>
      </ChartCard>
    )
  }

  const showLabels = currentData.length <= 6
  const goalLine = previousData.length > 0
    ? previousData.reduce((s, d) => s + d.volume, 0) / previousData.length
    : undefined

  // Merge for comparison overlay
  const chartData = currentData.map((d) => ({
    ...d,
    prevVolume: previousData.find((p) => p.week === d.week)?.volume,
  }))

  const handleBarClick = (data: Record<string, unknown>) => {
    setDrillDown({
      title: String(data.weekLabel),
      subtitle: t('stats.detalleSemana'),
      metrics: [
        { label: t('stats.volumen'), value: formatVolume(Number(data.volume)) },
        { label: t('stats.volumenTooltip'), value: `${Math.round(applyUnits(Number(data.volume), settings.units)).toLocaleString()} ${formatUnits(settings.units)}` },
      ],
    })
  }

  return (
    <ChartCard
      title={t('stats.rangoVolumen')}
      stats={<StatRow stats={stats} />}
      footer={trendPct !== 0 ? <TrendBadge value={trendPct} label={`vs ${t('stats.periodoAnterior')}`} /> : undefined}
    >
      <AnimatedBarChart
        data={chartData}
        height={240}
        barCategoryGap="22%"
        margin={{ top: showLabels ? 28 : 8, right: 4, left: 0, bottom: 0 }}
      >
        <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="weekLabel"
          tick={axisTick(colors)}
          axisLine={false}
          tickLine={false}
          minTickGap={12}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={axisTick(colors)}
          axisLine={false}
          tickLine={false}
          width={36}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={tooltipStyle(colors)}
          labelStyle={{ color: colors.muted }}
          itemStyle={{ color: colors.fg }}
          formatter={(value, name) => {
            if (name === 'prevVolume') return [formatVolume(Number(value)), t('stats.periodoAnterior')]
            return [`${Math.round(applyUnits(Number(value), settings.units)).toLocaleString()} ${formatUnits(settings.units)}`, t('stats.volumenTooltip')]
          }}
        />
        {/* Previous period comparison (ghost bars) */}
        {previousData.length > 0 && (
          <Bar dataKey="prevVolume" radius={[4, 4, 0, 0]} maxBarSize={32} fill={colors.muted} fillOpacity={0.2} />
        )}
        {/* Goal line: previous period average */}
        {goalLine != null && goalLine > 0 && (
          <ReferenceLine
            y={goalLine}
            stroke={colors.gold}
            strokeDasharray="6 4"
            strokeWidth={1.5}
          />
        )}
        <Bar dataKey="volume" radius={[6, 6, 0, 0]} maxBarSize={40} onClick={(d) => handleBarClick(d as unknown as Record<string, unknown>)} cursor="pointer">
          {chartData.map((_, i) => (
            <Cell key={i} fill={i === chartData.length - 1 ? colors.cta : colors.gold} />
          ))}
          {showLabels && (
            <LabelList
              dataKey="volume"
              position="top"
              offset={6}
              formatter={(v) => formatVolume(Number(v))}
              style={{ fill: colors.fg, fontSize: 11, fontWeight: 500 }}
            />
          )}
        </Bar>
      </AnimatedBarChart>

      <DrillDownPanel data={drillDown} onClose={() => setDrillDown(null)} />
    </ChartCard>
  )
}
