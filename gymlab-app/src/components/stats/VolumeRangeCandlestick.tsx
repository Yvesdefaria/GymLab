// Barras redondeadas del volumen total por semana — reemplaza las velas OHLC de volumen.
import { useMemo } from 'react'
import { AnimatedBarChart } from './AnimatedCharts'
import { XAxis, YAxis, Tooltip, CartesianGrid, Bar, Cell, LabelList } from 'recharts'
import { useThemeColors } from '@/hooks/useThemeColors'
import { useSettings } from '@/hooks/useSettings'
import { axisTick, tooltipStyle } from './chartStyle'
import { weekStartKey } from '@/domain/trainingStats'
import type { Workout } from '@/domain/types'
import { applyUnits, formatUnits } from '@/domain/settings'
import { formatVolume } from '@/domain/volume'

type Props = {
  workouts: Workout[]
}

const weekLabel = (week: string): string =>
  new Date(week + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })

export const VolumeRangeCandlestick = ({ workouts }: Props) => {
  const colors = useThemeColors()
  const { settings } = useSettings()

  const data = useMemo(() => {
    const byWeek = new Map<string, number>()
    for (const w of workouts) {
      const dateStr = w.localDate ?? new Date(w.startedAt).toISOString().slice(0, 10)
      const week = weekStartKey(dateStr)
      byWeek.set(week, (byWeek.get(week) ?? 0) + w.totalVolume)
    }
    return Array.from(byWeek.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([week, volume]) => ({ week: weekLabel(week), volume }))
  }, [workouts])

  if (data.length === 0) {
    return <p className="py-4 text-center text-sm text-muted">Aún no hay sesiones registradas.</p>
  }

  const showLabels = data.length <= 6

  return (
    <div role="img" aria-label="Volumen total por semana">
      <AnimatedBarChart
        data={data}
        height={260}
        barCategoryGap="22%"
        margin={{ top: showLabels ? 28 : 8, right: 4, left: 0, bottom: 0 }}
      >
        <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="week"
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
          width={38}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={tooltipStyle(colors)}
          labelStyle={{ color: colors.muted }}
          itemStyle={{ color: colors.fg }}
          formatter={(value) => [
            `${Math.round(applyUnits(Number(value), settings.units)).toLocaleString()} ${formatUnits(settings.units)}`,
            'Volumen',
          ]}
        />
        <Bar dataKey="volume" radius={[6, 6, 0, 0]} maxBarSize={40}>
          {data.map((_, i) => (
            <Cell key={i} fill={i === data.length - 1 ? colors.cta : colors.gold} />
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
    </div>
  )
}
