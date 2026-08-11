// Histograma de sesiones por semana, filtrable por rango de fechas (gráfico de barras animado Recharts).
import { useMemo, useState } from 'react'
import { XAxis, YAxis, Tooltip, CartesianGrid, Bar, LabelList } from 'recharts'
import { AnimatedBarChart } from './AnimatedCharts'
import { useThemeColors } from '@/hooks/useThemeColors'
import { axisTick, tooltipStyle } from './chartStyle'
import { RangePills, inRange, type StatsRange } from './RangePills'
import type { FrequencyPoint } from '@/domain/trainingStats'

type Props = {
  points: FrequencyPoint[]
}

export const FrequencyChart = ({ points }: Props) => {
  const colors = useThemeColors()
  const [range, setRange] = useState<StatsRange>(30)

  const data = useMemo(() => {
    const now = Date.now()
    return points
      .filter((p) => inRange(p.week, range, now))
      .map((p) => ({
        week: new Date(p.week + 'T12:00:00').toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short',
        }),
        count: p.count,
      }))
  }, [points, range])

  if (data.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted">
        {points.length === 0 ? 'Aún no hay sesiones registradas.' : 'No hay entrenos en este rango.'}
      </p>
    )
  }

  const showLabels = data.length <= 8

  return (
    <div>
      <RangePills value={range} onChange={setRange} />
      <AnimatedBarChart
        data={data}
        height={260}
        label="Frecuencia de entrenamiento por semana"
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
          allowDecimals={false}
          tick={axisTick(colors)}
          axisLine={false}
          tickLine={false}
          width={24}
        />
        <Tooltip
          contentStyle={tooltipStyle(colors)}
          labelStyle={{ color: colors.muted }}
          itemStyle={{ color: colors.fg }}
          formatter={(value) => [`${value}`, 'Entrenos']}
        />
        <Bar dataKey="count" fill={colors.gold} radius={[6, 6, 0, 0]} maxBarSize={36}>
          {showLabels && (
            <LabelList
              dataKey="count"
              position="top"
              offset={6}
              style={{ fill: colors.fg, fontSize: 12, fontWeight: 500 }}
            />
          )}
        </Bar>
      </AnimatedBarChart>
    </div>
  )
}
