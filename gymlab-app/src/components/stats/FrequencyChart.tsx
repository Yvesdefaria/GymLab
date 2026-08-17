// FrequencyChart: sesiones por semana con ChartCard, stats, goal line y trend badge.
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Cell, LabelList, ResponsiveContainer } from 'recharts'
import { ChartCard } from './ChartCard'
import { StatRow, type StatItem } from './StatRow'
import { TrendBadge } from './TrendBadge'
import { useThemeColors } from '@/hooks/useThemeColors'
import { axisTick, tooltipStyle } from './chartStyle'
import type { FrequencyPoint } from '@/domain/trainingStats'

type Props = {
  points: FrequencyPoint[]
  weeklyGoal?: number
}

export const FrequencyChart = ({ points, weeklyGoal }: Props) => {
  const { t } = useTranslation()
  const colors = useThemeColors()

  const stats = useMemo((): StatItem[] => {
    const total = points.reduce((s, p) => s + p.count, 0)
    const avg = points.length > 0 ? total / points.length : 0
    return [
      { value: total, label: t('stats.totalEntrenos') },
      { value: Math.round(avg * 10) / 10, label: t('stats.frecuenciaSemanal'), format: 'decimal' },
    ]
  }, [points, t])

  if (points.length === 0) {
    return (
      <ChartCard title={t('stats.frecuenciaSemanal')}>
        <p className="py-4 text-center text-sm text-muted">{t('stats.sinSesiones')}</p>
      </ChartCard>
    )
  }

  const showLabels = points.length <= 8

  return (
    <ChartCard
      title={t('stats.frecuenciaSemanal')}
      stats={<StatRow stats={stats} />}
      footer={weeklyGoal != null && weeklyGoal > 0 ? <TrendBadge value={0} label={`${t('stats.objetivoSemanal')}: ${weeklyGoal}`} /> : undefined}
    >
      <div role="img" aria-label={t('stats.frecuenciaAria')}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={points} margin={{ top: showLabels ? 24 : 8, right: 4, left: 0, bottom: 0 }} barCategoryGap="20%">
            <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="week" tick={axisTick(colors)} axisLine={false} tickLine={false} minTickGap={12} interval="preserveStartEnd" />
            <YAxis tick={axisTick(colors)} axisLine={false} tickLine={false} width={36} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle(colors)} labelStyle={{ color: colors.muted }} itemStyle={{ color: colors.fg }} formatter={(value) => [value, t('stats.entrenosTooltip')]} />
            {weeklyGoal != null && weeklyGoal > 0 && (
              <ReferenceLine y={weeklyGoal} stroke={colors.gold} strokeDasharray="6 4" strokeWidth={1.5} />
            )}
            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={36}>
              {points.map((_, i) => (
                <Cell key={i} fill={i === points.length - 1 ? colors.cta : colors.gold} />
              ))}
              {showLabels && (
                <LabelList dataKey="count" position="top" offset={4} style={{ fill: colors.fg, fontSize: 11, fontWeight: 500 }} />
              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
