import { useMemo, useState } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { useThemeColors } from '@/hooks/useThemeColors'
import { getIMCCategory, imcCategoryLabel } from '@/domain/calculators/imc'
import { axisTick, tooltipStyle } from './chartStyle'
import { RangePills, inRange, type StatsRange } from './RangePills'
import type { ImcPoint } from '@/domain/calculators/bodyComposition'

type Props = {
  points: ImcPoint[]
}

export const ImcChart = ({ points }: Props) => {
  const colors = useThemeColors()
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
          imc: p.imc,
          cat: imcCategoryLabel(getIMCCategory(p.imc)),
        })),
    [points, range],
  )

  if (data.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted">
        {points.length === 0 ? 'Registra tu peso para calcular tu IMC.' : 'No hay registros en este rango.'}
      </p>
    )
  }

  const min = Math.min(...data.map((d) => d.imc)) - 0.5
  const max = Math.max(...data.map((d) => d.imc)) + 0.5

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
            formatter={(value, _name, item) => [
              `${value} · ${(item as { payload?: { cat?: string } }).payload?.cat ?? ''}`,
              'IMC',
            ]}
          />
          <Line
            type="monotone"
            dataKey="imc"
            stroke={colors.gold}
            strokeWidth={2.5}
            dot={{ r: 3, fill: colors.gold, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
