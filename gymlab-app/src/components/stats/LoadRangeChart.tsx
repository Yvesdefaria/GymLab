// LoadRangeChart: progresión de carga por sesión con ChartCard, stats, PR marker y drill-down.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { XAxis, YAxis, Tooltip, CartesianGrid, Area, ReferenceDot } from 'recharts'
import { AnimatedAreaChart } from './AnimatedCharts'
import { ChartCard } from './ChartCard'
import { StatRow, type StatItem } from './StatRow'
import { DrillDownPanel, type DrillDownData } from './DrillDownPanel'
import { useThemeColors } from '@/hooks/useThemeColors'
import { useSettings } from '@/hooks/useSettings'
import { axisTick, tooltipStyle } from './chartStyle'
import { applyUnits, formatUnits } from '@/domain/settings'
import { formatDayShort } from '@/lib/intl'
import { buildLoadRangeSeries } from '@/domain/trainingStats'
import type { Exercise, Workout, WorkoutSet } from '@/domain/types'
import type { AppLanguage } from '@/domain/onboarding'

type Props = {
  sets: WorkoutSet[]
  workoutsById: ReadonlyMap<number, Workout>
  exercises: Exercise[]
}

export const LoadRangeChart = ({ sets, workoutsById, exercises }: Props) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const colors = useThemeColors()
  const { settings } = useSettings()
  const [drillDown, setDrillDown] = useState<DrillDownData | null>(null)

  const data = useMemo(() => {
    if (exercises.length === 0) return []
    const exerciseId = exercises[0].id
    const exerciseSets = sets.filter((s) => s.exerciseId === exerciseId && s.completed)
    if (exerciseSets.length === 0) return []
    return buildLoadRangeSeries(exerciseSets, workoutsById, exerciseId).map((p) => ({
      date: formatDayShort(p.date, lang),
      high: applyUnits(p.high, settings.units),
      low: applyUnits(p.low, settings.units),
    }))
  }, [sets, workoutsById, exercises, lang, settings.units])

  const stats = useMemo((): StatItem[] => {
    if (data.length === 0) return []
    const maxLoad = Math.max(...data.map((d) => d.high))
    const avgLoad = data.reduce((s, d) => s + d.high, 0) / data.length
    return [
      { value: maxLoad, label: t('stats.cargaMax'), format: 'decimal' as const, suffix: ` ${formatUnits(settings.units)}` },
      { value: Math.round(avgLoad * 10) / 10, label: t('stats.duracionMedia'), format: 'decimal' as const, suffix: ` ${formatUnits(settings.units)}` },
    ]
  }, [data, settings.units, t])

  if (data.length === 0) {
    return (
      <ChartCard title={t('stats.cargasSesion')}>
        <p className="py-4 text-center text-sm text-muted">{t('stats.cargasSinDatos')}</p>
      </ChartCard>
    )
  }

  const maxIdx = data.reduce((mi, d, i, arr) => (d.high > arr[mi].high ? i : mi), 0)

  return (
    <ChartCard
      title={t('stats.cargasSesion')}
      stats={<StatRow stats={stats} />}
    >
      <AnimatedAreaChart data={data} height={220} label={t('stats.cargasAria', { ejercicio: exercises[0]?.name ?? '' })} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="loadGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.gold} stopOpacity={0.3} />
            <stop offset="95%" stopColor={colors.gold} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tick={axisTick(colors)} axisLine={false} tickLine={false} minTickGap={12} interval="preserveStartEnd" />
        <YAxis tick={axisTick(colors)} axisLine={false} tickLine={false} width={36} />
        <Tooltip contentStyle={tooltipStyle(colors)} labelStyle={{ color: colors.muted }} itemStyle={{ color: colors.fg }} formatter={(value) => [`${Math.round(applyUnits(Number(value), settings.units))} ${formatUnits(settings.units)}`, t('stats.cargaMax')]} />
        <Area type="monotone" dataKey="high" stroke={colors.gold} strokeWidth={2.5} fill="url(#loadGradient)" dot={{ r: 4, fill: colors.gold, strokeWidth: 0 }} activeDot={{ r: 6, fill: colors.cta, strokeWidth: 0 }} />
        <ReferenceDot x={data[maxIdx]?.date} y={data[maxIdx]?.high} r={5} fill={colors.cta} stroke="none" />
      </AnimatedAreaChart>
      <p className="mt-2 text-center text-xs text-muted">{t('stats.cargasPie')}</p>
      <DrillDownPanel data={drillDown} onClose={() => setDrillDown(null)} />
    </ChartCard>
  )
}
