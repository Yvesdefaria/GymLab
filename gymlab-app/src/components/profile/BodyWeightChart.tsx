import { useMemo, useState } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { useThemeColors } from '@/hooks/useThemeColors'
import { useSettings } from '@/hooks/useSettings'
import { applyUnits, formatUnits } from '@/domain/settings'
import type { BodyWeightEntry } from '@/domain/types'

type Range = 30 | 90 | 0

const RANGES: { value: Range; label: string }[] = [
  { value: 30, label: '30 d' },
  { value: 90, label: '90 d' },
  { value: 0, label: 'Todo' },
]

type Props = {
  entries: BodyWeightEntry[]
}

export const BodyWeightChart = ({ entries }: Props) => {
  const colors = useThemeColors()
  const { settings } = useSettings()
  const [range, setRange] = useState<Range>(30)

  const data = useMemo(() => {
    const now = Date.now()
    const DAY = 86_400_000
    const cutoff = range === 0 ? 0 : now - range * DAY
    return entries
      .filter((e) => {
        if (range === 0) return true
        return new Date(e.localDate + 'T12:00:00').getTime() >= cutoff
      })
      .map((e) => ({
        date: new Date(e.localDate + 'T12:00:00').toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short',
        }),
        peso: Math.round(applyUnits(e.weightKg, settings.units) * 10) / 10,
      }))
  }, [entries, range, settings.units])

  if (data.length < 2) {
    return (
      <p className="py-4 text-center text-sm text-muted">
        Necesitas al menos 2 registros en este rango.
      </p>
    )
  }

  const min = Math.min(...data.map((d) => d.peso)) - 1
  const max = Math.max(...data.map((d) => d.peso)) + 1

  return (
    <div>
      <div className="mb-2 flex gap-2">
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            aria-pressed={range === r.value}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              range === r.value
                ? 'border-cta bg-cta/20 text-accent-soft'
                : 'border-border text-muted hover:border-cta'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: colors.muted, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            domain={[min, max]}
            tick={{ fill: colors.muted, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}${formatUnits(settings.units)}`}
            width={40}
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
            formatter={(value) => [`${value} ${formatUnits(settings.units)}`, 'Peso']}
          />
          <Line
            type="monotone"
            dataKey="peso"
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
