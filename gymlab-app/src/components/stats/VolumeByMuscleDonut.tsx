import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { useThemeColors } from '@/hooks/useThemeColors'
import { tooltipStyle } from './chartStyle'
import { formatVolume } from '@/domain/volume'
import { MUSCLE_GROUP_LABELS } from '@/domain/routines'
import type { MuscleVolume } from '@/domain/trainingStats'

type Props = {
  data: MuscleVolume[]
}

const PALETTE = ['#d9b384', '#b07f2e', '#22c55e', '#3b82f6', '#a855f7', '#ef4444', '#eab308', '#14b8a6', '#ec4899']

export const VolumeByMuscleDonut = ({ data }: Props) => {
  const colors = useThemeColors()

  if (data.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted">
        Aún no hay datos de volumen por grupo muscular.
      </p>
    )
  }

  const total = data.reduce((acc, d) => acc + d.volume, 0)

  return (
    <div>
      <div
        className="relative"
        role="img"
        aria-label={`Reparto del volumen por grupo muscular: ${data.map((d) => `${MUSCLE_GROUP_LABELS[d.muscle] ?? d.muscle} ${formatVolume(d.volume)}`).join(', ')}`}
      >
        <ResponsiveContainer width="100%" height={190}>
          <PieChart>
            <Pie
              data={data}
              dataKey="volume"
              nameKey="muscle"
              innerRadius={50}
              outerRadius={74}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle(colors)}
              itemStyle={{ color: colors.fg }}
              formatter={(value, _name, item) => {
                const pct = total > 0 ? Math.round((Number(value) / total) * 100) : 0
                return [`${formatVolume(Number(value))} · ${pct}%`, MUSCLE_GROUP_LABELS[(item as { payload?: { muscle?: string } }).payload?.muscle ?? ''] ?? '']
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[0.65rem] uppercase tracking-wide text-muted">Total</p>
          <p className="font-display text-lg font-semibold text-fg">{formatVolume(total)}</p>
        </div>
      </div>
      <ul className="mt-2 space-y-1 text-sm">
        {data.map((d, i) => (
          <li key={d.muscle} className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} aria-hidden />
              {MUSCLE_GROUP_LABELS[d.muscle] ?? d.muscle}
            </span>
            <span className="font-medium text-fg">
              {formatVolume(d.volume)} ({total > 0 ? Math.round((d.volume / total) * 100) : 0}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
