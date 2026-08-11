// Evolución del 1RM estimado por ejercicio en área con gradiente — reemplaza la línea plana.
import { useMemo } from 'react'
import { XAxis, YAxis, Tooltip, Area, ReferenceDot } from 'recharts'
import { AnimatedAreaChart } from '@/components/stats/AnimatedCharts'
import { useThemeColors } from '@/hooks/useThemeColors'
import { useSettings } from '@/hooks/useSettings'
import { tooltipStyle, axisTick } from '@/components/stats/chartStyle'
import { applyUnits, formatUnits } from '@/domain/settings'
import type { E1rmPoint } from '@/domain/e1rm'

type E1rmChartProps = {
  points: E1rmPoint[]
}

export const E1rmChart = ({ points }: E1rmChartProps) => {
  const colors = useThemeColors()
  const { settings } = useSettings()

  const data = useMemo(
    () =>
      points.map((p) => ({
        ...p,
        label: new Date(p.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
      })),
    [points],
  )

  if (data.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted">
        Registra una sesión con peso para ver la evolución de tu 1RM estimado.
      </p>
    )
  }

  return (
    <AnimatedAreaChart data={data} height={220} label="Evolución del 1RM estimado" margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id="e1rmGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={colors.gold} stopOpacity={0.3} />
          <stop offset="95%" stopColor={colors.gold} stopOpacity={0} />
        </linearGradient>
      </defs>
      <XAxis
        dataKey="label"
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
        tickFormatter={(v) => String(Math.round(applyUnits(Number(v), settings.units)))}
        width={36}
      />
      <Tooltip
        contentStyle={tooltipStyle(colors)}
        labelStyle={{ color: colors.muted }}
        itemStyle={{ color: colors.fg }}
        formatter={(value) => [
          `${Math.round(applyUnits(Number(value), settings.units))} ${formatUnits(settings.units)}`,
          '1RM est.',
        ]}
      />
      <Area
        type="monotone"
        dataKey="estimated1RM"
        stroke={colors.gold}
        strokeWidth={2.5}
        fill="url(#e1rmGradient)"
        dot={{ r: 4, fill: colors.gold, strokeWidth: 0 }}
        activeDot={{ r: 6, fill: colors.cta, strokeWidth: 0 }}
      />
      <ReferenceDot
        x={data[data.length - 1].label}
        y={data[data.length - 1].estimated1RM}
        r={5}
        fill={colors.cta}
        stroke="none"
      />
    </AnimatedAreaChart>
  )
}
