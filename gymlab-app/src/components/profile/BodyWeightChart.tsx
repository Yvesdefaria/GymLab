// Gráfico de evolución del peso corporal con rangos temporales y unidades del usuario (área con gradiente).
import { useMemo, useState } from 'react'
import { XAxis, YAxis, Tooltip, CartesianGrid, Area } from 'recharts'
import { AnimatedAreaChart } from '@/components/stats/AnimatedCharts'
import { useThemeColors } from '@/hooks/useThemeColors'
import { useSettings } from '@/hooks/useSettings'
import { axisTick, tooltipStyle } from '@/components/stats/chartStyle'
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

  if (data.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted">
        {entries.length === 0 ? 'Registra tu peso para ver la evolución.' : 'No hay registros en este rango.'}
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

      <AnimatedAreaChart data={data} height={220} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.gold} stopOpacity={0.3} />
            <stop offset="95%" stopColor={colors.gold} stopOpacity={0} />
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
        <YAxis
          domain={[min, max]}
          tick={axisTick(colors)}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}${formatUnits(settings.units)}`}
          width={40}
        />
        <Tooltip
          contentStyle={tooltipStyle(colors)}
          labelStyle={{ color: colors.muted }}
          itemStyle={{ color: colors.fg }}
          formatter={(value) => [`${value} ${formatUnits(settings.units)}`, 'Peso']}
        />
        <Area
          type="monotone"
          dataKey="peso"
          stroke={colors.gold}
          strokeWidth={2.5}
          fill="url(#weightGradient)"
          dot={{ r: 4, fill: colors.gold, strokeWidth: 0 }}
          activeDot={{ r: 6, fill: colors.cta, strokeWidth: 0 }}
        />
      </AnimatedAreaChart>
    </div>
  )
}
