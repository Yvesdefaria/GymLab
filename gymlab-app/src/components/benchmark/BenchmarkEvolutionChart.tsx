// BenchmarkEvolutionChart: gráfico de evolución de e1rm por ejercicio de benchmark.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { XAxis, YAxis, Tooltip, CartesianGrid, Area } from 'recharts'
import { AnimatedAreaChart } from '@/components/stats/AnimatedCharts'
import { ChartCard } from '@/components/stats/ChartCard'
import { StatRow, type StatItem } from '@/components/stats/StatRow'
import { TrendBadge } from '@/components/stats/TrendBadge'
import { useThemeColors } from '@/hooks/useThemeColors'
import { useSettings } from '@/hooks/useSettings'
import { tooltipStyle, axisTick } from '@/components/stats/chartStyle'
import { applyUnits, formatUnits } from '@/domain/settings'
import { formatDate } from '@/lib/intl'
import { sortByDate } from '@/domain/benchmark'
import type { AppLanguage } from '@/domain/onboarding'
import type { BenchmarkResult } from '@/domain/types'
import type { BenchmarkExercise } from '@/domain/benchmark'

type BenchmarkEvolutionChartProps = {
  results: BenchmarkResult[]
}

const EXERCISES: BenchmarkExercise[] = ['sentadilla', 'banca', 'peso_muerto', 'press_militar']

export const BenchmarkEvolutionChart = ({ results }: BenchmarkEvolutionChartProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const colors = useThemeColors()
  const { settings } = useSettings()
  const [selected, setSelected] = useState<BenchmarkExercise>('sentadilla')

  const exerciseResults = useMemo(
    () => sortByDate(results.filter((r) => r.exercise === selected)),
    [results, selected],
  )

  const data = useMemo(
    () =>
      exerciseResults.map((r) => ({
        ...r,
        label: formatDate(r.testedAt, lang, { day: 'numeric', month: 'short' }),
        displayValue: Math.round(applyUnits(r.e1rm, settings.units)),
      })),
    [exerciseResults, lang, settings.units],
  )

  const stats = useMemo((): StatItem[] => {
    if (data.length === 0) return []
    const current = data[0].displayValue // most recent (sorted desc)
    return [
      { value: current, label: '1RM', format: 'decimal' as const, suffix: ` ${formatUnits(settings.units)}` },
    ]
  }, [data, settings.units])

  const trendPct = useMemo(() => {
    if (data.length < 2) return 0
    const first = data[0].displayValue
    const last = data[data.length - 1].displayValue
    return first !== 0 ? ((last - first) / first) * 100 : 0
  }, [data])

  // Recharts needs ascending order
  const chartData = useMemo(() => [...data].reverse(), [data])

  if (results.length === 0) {
    return (
      <ChartCard title={t('benchmark.title')}>
        <p className="py-4 text-center text-sm text-muted">{t('benchmark.noData')}</p>
      </ChartCard>
    )
  }

  return (
    <ChartCard
      title={t('benchmark.title')}
      stats={<StatRow stats={stats} />}
      actions={
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value as BenchmarkExercise)}
          className="rounded-lg border border-border/30 bg-bg-elevated/50 px-2 py-1 text-[0.6rem] text-fg"
        >
          {EXERCISES.map((ex) => (
            <option key={ex} value={ex}>{t(`benchmark.exercise.${ex}` as any)}</option>
          ))}
        </select>
      }
      footer={trendPct !== 0 ? <TrendBadge value={trendPct} label="total" /> : undefined}
    >
      <AnimatedAreaChart data={chartData} height={220} label={t('benchmark.title')} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="benchGrad" x1="0" y1="0" x2="0" y2="1">
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
          formatter={(value) => [`${Math.round(applyUnits(Number(value), settings.units))} ${formatUnits(settings.units)}`, 'e1RM']}
        />
        <Area type="monotone" dataKey="e1rm" stroke={colors.gold} strokeWidth={2.5} fill="url(#benchGrad)" dot={{ r: 4, fill: colors.gold, strokeWidth: 0 }} activeDot={{ r: 6, fill: colors.cta, strokeWidth: 0, style: { outline: 'none' } }} />
      </AnimatedAreaChart>
    </ChartCard>
  )
}
