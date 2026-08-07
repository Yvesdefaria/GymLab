import { useMemo, useState } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LabelList } from 'recharts'
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

  return (
    <div>
      <RangePills value={range} onChange={setRange} />
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="week" tick={axisTick(colors)} axisLine={false} tickLine={false} minTickGap={16} />
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
          <Bar dataKey="count" fill={colors.gold} radius={[6, 6, 0, 0]} maxBarSize={28}>
            <LabelList dataKey="count" position="top" style={{ fill: colors.fg, fontSize: 11 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
