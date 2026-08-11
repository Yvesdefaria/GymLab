// Evolución temporal de masa grasa vs magra en el rango seleccionado (gráfico de áreas Recharts).
import { useMemo, useState } from 'react'
import { XAxis, YAxis, Tooltip, CartesianGrid, Legend, Area } from 'recharts'
import { AnimatedAreaChart } from './AnimatedCharts'
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
      <AnimatedAreaChart data={data} height={240} label="Evolución de masa grasa y masa magra" margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="fatMassGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.danger} stopOpacity={0.2} />
            <stop offset="95%" stopColor={colors.danger} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="fatFreeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.success} stopOpacity={0.2} />
            <stop offset="95%" stopColor={colors.success} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tick={axisTick(colors)}
          axisLine={false}
          tickLine={false}
          minTickGap={12}
          interval="preserveStartEnd"
        />
        <YAxis domain={[min, max]} tick={axisTick(colors)} axisLine={false} tickLine={false} width={36} />
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
        <Area
          type="monotone"
          dataKey="fatMass"
          name="Masa grasa"
          stroke={colors.danger}
          strokeWidth={2.5}
          fill="url(#fatMassGradient)"
          dot={{ r: 4, fill: colors.danger, strokeWidth: 0 }}
          activeDot={{ r: 6, fill: colors.cta, strokeWidth: 0 }}
          connectNulls
        />
        <Area
          type="monotone"
          dataKey="fatFreeMass"
          name="Masa magra"
          stroke={colors.success}
          strokeWidth={2.5}
          fill="url(#fatFreeGradient)"
          dot={{ r: 4, fill: colors.success, strokeWidth: 0 }}
          activeDot={{ r: 6, fill: colors.cta, strokeWidth: 0 }}
          connectNulls
        />
      </AnimatedAreaChart>
    </div>
  )
}
