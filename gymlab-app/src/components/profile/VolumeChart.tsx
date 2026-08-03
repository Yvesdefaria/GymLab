import { useMemo } from 'react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'
import { useThemeColors } from '@/hooks/useThemeColors'
import type { Workout } from '@/domain/types'

type VolumeChartProps = {
  workouts: Workout[]
}

const getWeekLabel = (date: Date): string => {
  return `${date.getDate()}/${date.getMonth() + 1}`
}

export const VolumeChart = ({ workouts }: VolumeChartProps) => {
  const colors = useThemeColors()

  const data = useMemo(() => {
    const sorted = [...workouts].sort(
      (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
    )

    if (sorted.length === 0) return []

    const weeks = new Map<string, number>()

    for (const w of sorted) {
      const d = new Date(w.startedAt)
      const weekStart = new Date(d.getTime() - (d.getDay() * 86_400_000))
      const key = getWeekLabel(weekStart)
      weeks.set(key, (weeks.get(key) ?? 0) + w.totalVolume)
    }

    return Array.from(weeks.entries()).map(([week, volume]) => ({
      week,
      volume,
    }))
  }, [workouts])

  if (data.length < 2) {
    return (
      <p className="py-4 text-center text-sm text-muted">
        Necesitas al menos 2 sesiones para ver el gráfico.
      </p>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.gold} stopOpacity={0.3} />
            <stop offset="95%" stopColor={colors.gold} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="week"
          tick={{ fill: colors.muted, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: colors.muted, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: colors.bgElevated,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            color: colors.fg,
            fontSize: 12,
          }}
          formatter={(value) => [`${Number(value).toLocaleString()} kg`, 'Volumen']}
        />
        <Area
          type="monotone"
          dataKey="volume"
          stroke={colors.gold}
          strokeWidth={2}
          fill="url(#volumeGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
