// Evolución de ratios cintura/altura y cintura/cadera, con líneas de referencia de riesgo según sexo.
import { useMemo, useState } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ReferenceLine } from 'recharts'
import { useThemeColors } from '@/hooks/useThemeColors'
import { axisTick, tooltipStyle } from './chartStyle'
import { RangePills, inRange, type StatsRange } from './RangePills'
import type { RatiosPoint } from '@/domain/calculators/bodyComposition'
import type { Sex } from '@/domain/types'

type Props = {
  points: RatiosPoint[]
  sex: Sex
}

export const RatiosChart = ({ points, sex }: Props) => {
  const colors = useThemeColors()
  const [range, setRange] = useState<StatsRange>(30)
  // Límite de riesgo de cintura/cadera: 0.9 en hombres y 0.8 en mujeres (referencia en el gráfico).
  const whrLimit = sex === 'male' ? 0.9 : 0.8

  // Filtra por rango y formatea la fecha de cada punto para el eje X.
  const data = useMemo(
    () =>
      points
        .filter((p) => inRange(p.date, range))
        .map((p) => ({
          date: new Date(p.date + 'T12:00:00').toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
          }),
          whtr: p.whtr,
          whr: p.whr,
        })),
    [points, range],
  )

  if (data.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted">
        {points.length === 0
          ? 'Registra cintura y cadera en Medidas corporales para ver tus ratios.'
          : 'No hay registros en este rango.'}
      </p>
    )
  }

  return (
    <div>
      <RangePills value={range} onChange={setRange} />
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tick={axisTick(colors)} axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis
            domain={[0.3, 1.2]}
            tick={axisTick(colors)}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={tooltipStyle(colors)}
            labelStyle={{ color: colors.muted }}
            itemStyle={{ color: colors.fg }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: colors.muted }}
            formatter={(value) => <span style={{ color: colors.muted }}>{value}</span>}
          />
          <ReferenceLine
            y={0.5}
            stroke={colors.cta}
            strokeDasharray="4 4"
            label={{ value: 'WHtR 0.5', fill: colors.muted, fontSize: 10, position: 'insideTopRight' }}
          />
          <ReferenceLine
            y={whrLimit}
            stroke={colors.muted}
            strokeDasharray="4 4"
            label={{ value: `WHR ${whrLimit}`, fill: colors.muted, fontSize: 10, position: 'insideBottomRight' }}
          />
          <Line
            type="monotone"
            dataKey="whtr"
            name="Cintura/altura"
            stroke={colors.gold}
            strokeWidth={2.5}
            dot={{ r: 3, fill: colors.gold, strokeWidth: 0 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="whr"
            name="Cintura/cadera"
            stroke={colors.accent}
            strokeWidth={2.5}
            dot={{ r: 3, fill: colors.accent, strokeWidth: 0 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
