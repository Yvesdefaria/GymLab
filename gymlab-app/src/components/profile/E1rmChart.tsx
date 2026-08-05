import { useMemo } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceDot } from 'recharts'
import { useThemeColors } from '@/hooks/useThemeColors'
import { useSettings } from '@/hooks/useSettings'
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
        label: new Date(p.date).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short',
        }),
      })),
    [points]
  )

  if (data.length < 2) {
    return (
      <p className="py-4 text-center text-sm text-muted">
        Registra al menos 2 sesiones para ver la evolución de tu 1RM estimado.
      </p>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data}>
        <XAxis
          dataKey="label"
          tick={{ fill: colors.muted, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: colors.muted, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => String(Math.round(applyUnits(Number(v), settings.units)))}
          width={34}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: colors.bgElevated,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            color: colors.fg,
            fontSize: 12,
          }}
          labelStyle={{ color: colors.muted }}
          itemStyle={{ color: colors.fg }}
          formatter={(value) => [
            `${Math.round(applyUnits(Number(value), settings.units))} ${formatUnits(settings.units)}`,
            '1RM est.',
          ]}
        />
        <Line
          type="monotone"
          dataKey="estimated1RM"
          stroke={colors.gold}
          strokeWidth={2}
          dot={{ r: 3, fill: colors.gold, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
        <ReferenceDot
          x={data[data.length - 1].label}
          y={data[data.length - 1].estimated1RM}
          r={5}
          fill={colors.cta}
          stroke="none"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
