// Barras redondeadas del volumen semanal total — reemplaza el área plana, valor visible encima de cada barra.
import { useMemo } from 'react'
import { XAxis, YAxis, Tooltip, CartesianGrid, Bar, Cell, LabelList } from 'recharts'
import { AnimatedBarChart } from '@/components/stats/AnimatedCharts'
import { useThemeColors } from '@/hooks/useThemeColors'
import { useSettings } from '@/hooks/useSettings'
import { tooltipStyle, axisTick } from '@/components/stats/chartStyle'
import { applyUnits, formatUnits } from '@/domain/settings'
import { formatVolume } from '@/domain/volume'
import type { Workout } from '@/domain/types'

type VolumeChartProps = {
  workouts: Workout[]
}

const getWeekKey = (date: Date): string => {
  const d = new Date(date)
  const mondayOffset = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - mondayOffset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const VolumeChart = ({ workouts }: VolumeChartProps) => {
  const colors = useThemeColors()
  const { settings } = useSettings()

  const data = useMemo(() => {
    const sorted = [...workouts].sort(
      (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
    )
    if (sorted.length === 0) return []

    const weeks = new Map<string, number>()
    for (const w of sorted) {
      const d = new Date(w.startedAt)
      const key = getWeekKey(d)
      weeks.set(key, (weeks.get(key) ?? 0) + w.totalVolume)
    }

    return Array.from(weeks.entries()).map(([weekKey, volume]) => {
      const d = new Date(weekKey + 'T12:00:00')
      const week = `${d.getDate()}/${d.getMonth() + 1}`
      return { week, volume }
    })
  }, [workouts])

  if (workouts.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted">Aún no hay sesiones registradas.</p>
    )
  }

  // Direct labeling: label visible solo si hay ≤6 barras (suficiente espacio entre ellas).
  const showLabels = data.length <= 6

  return (
    <AnimatedBarChart
      data={data}
      height={240}
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
  )
}
