import { useMemo, useState } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'
import { useThemeColors } from '@/hooks/useThemeColors'
import { axisTick, tooltipStyle } from './chartStyle'
import { RangePills, inRange, type StatsRange } from './RangePills'
import type { BodyCompPoint } from '@/domain/calculators/bodyComposition'
import { useSettings } from '@/hooks/useSettings'
import { applyUnits, formatUnits } from '@/domain/settings'

type Props = {
  points: BodyCompPoint[]
}

export const CompositionChart = ({ points }: Props) => {
  const colors = useThemeColors()
  const { settings } = useSettings()
  const [range, setRange] = useState<StatsRange>(30)

  const data = useMemo(
    () =>
      points
        .filter((p) => inRange(p.date, range))
        .map((p) => ({
          date: new Date(p.date + 'T12:00:00').toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
          }),
          fatMass: p.fatMassKg != null ? Math.round(applyUnits(p.fatMassKg, settings.units) * 10) / 10 : null,
          fatFreeMass: p.fatFreeMassKg != null ? Math.round(applyUnits(p.fatFreeMassKg, settings.units) * 10) / 10 : null,
        })),
    [points, range, settings.units],
  )

  if (data.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted">
        {points.length === 0
          ? 'Registra pliegues y tu peso en Grasa corporal para ver masa grasa y magra.'
          : 'No hay registros en este rango.'}
      </p>
    )
  }

  const values = data.flatMap((d) => [d.fatMass, d.fatFreeMass]).filter((v): v is number => v != null)
  const min = Math.min(...values) - 2
  const max = Math.max(...values) + 2

  return (
    <div>
      <RangePills value={range} onChange={setRange} />
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tick={axisTick(colors)} axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis
            domain={[min, max]}
            tick={axisTick(colors)}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={tooltipStyle(colors)}
            labelStyle={{ color: colors.muted }}
            itemStyle={{ color: colors.fg }}
            formatter={(value) => [`${value} ${formatUnits(settings.units)}`]}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: colors.muted }}
            formatter={(value) => <span style={{ color: colors.muted }}>{value}</span>}
          />
          <Line
            type="monotone"
            dataKey="fatMass"
            name="Masa grasa"
            stroke={colors.danger}
            strokeWidth={2.5}
            dot={{ r: 3, fill: colors.danger, strokeWidth: 0 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="fatFreeMass"
            name="Masa magra"
            stroke={colors.success}
            strokeWidth={2.5}
            dot={{ r: 3, fill: colors.success, strokeWidth: 0 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
