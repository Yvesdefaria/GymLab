import { useMemo, useState } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { useThemeColors } from '@/hooks/useThemeColors'
import { BODY_ZONES } from '@/domain/bodyMeasurements'
import type { BodyMeasurementEntry, BodyZone } from '@/domain/types'

type Range = 30 | 90 | 0

const RANGES: { value: Range; label: string }[] = [
  { value: 30, label: '30 d' },
  { value: 90, label: '90 d' },
  { value: 0, label: 'Todo' },
]

type Props = {
  entries: BodyMeasurementEntry[]
}

export const BodyMeasurementsChart = ({ entries }: Props) => {
  const colors = useThemeColors()
  const [zone, setZone] = useState<BodyZone>('cintura')
  const [range, setRange] = useState<Range>(30)

  const data = useMemo(() => {
    const DAY = 86_400_000
    const cutoff = range === 0 ? 0 : Date.now() - range * DAY
    return entries
      .filter((e) => {
        const v = e.values[zone]
        if (v == null) return false
        if (range === 0) return true
        return new Date(e.localDate + 'T12:00:00').getTime() >= cutoff
      })
      .map((e) => ({
        date: new Date(e.localDate + 'T12:00:00').toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short',
        }),
        valor: e.values[zone] as number,
      }))
  }, [entries, zone, range])

  return (
    <div>
      <div className="mb-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
        <div className="flex w-max gap-2">
          {BODY_ZONES.map((z) => (
            <button
              key={z.key}
              onClick={() => setZone(z.key)}
              aria-pressed={zone === z.key}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                zone === z.key
                  ? 'border-cta bg-cta/20 text-accent-soft'
                  : 'border-border text-muted hover:border-cta'
              }`}
            >
              {z.label}
            </button>
          ))}
        </div>
      </div>

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

      {data.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">
          {entries.length === 0
            ? 'Registra medidas para ver la evolución.'
            : 'No hay registros de esta zona en el rango.'}
        </p>
      ) : (
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
              domain={[Math.min(...data.map((d) => d.valor)) - 1, Math.max(...data.map((d) => d.valor)) + 1]}
              tick={{ fill: colors.muted, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={36}
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
              formatter={(value) => [`${value} cm`, BODY_ZONES.find((z) => z.key === zone)?.label]}
            />
            <Line
              type="monotone"
              dataKey="valor"
              stroke={colors.gold}
              strokeWidth={2.5}
              dot={{ r: 3, fill: colors.gold, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
