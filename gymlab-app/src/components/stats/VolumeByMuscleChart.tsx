// Barras horizontales de volumen por grupo muscular, con paleta fija y etiquetas de volumen al final (animado).
import { useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LabelList, ResponsiveContainer } from 'recharts'
import { useThemeColors } from '@/hooks/useThemeColors'
import { useChartEntry } from '@/hooks/useChartEntry'
import { axisTick, tooltipStyle } from './chartStyle'
import { formatVolume } from '@/domain/volume'
import { MUSCLE_GROUP_LABELS } from '@/domain/routines'
import type { MuscleVolume } from '@/domain/trainingStats'

type Props = {
  data: MuscleVolume[]
}

const PALETTE = ['#d9b384', '#b07f2e', '#22c55e', '#3b82f6', '#a855f7', '#ef4444', '#eab308', '#14b8a6', '#ec4899']

export const VolumeByMuscleChart = ({ data }: Props) => {
  const colors = useThemeColors()
  const ref = useRef<HTMLDivElement>(null)
  useChartEntry(ref, 'bar', data.length)

  if (data.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted">
        Completa series con peso para ver tu volumen por grupo muscular.
      </p>
    )
  }

  return (
    <div ref={ref}>
      <ResponsiveContainer width="100%" height={Math.max(180, data.length * 44)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 0, right: 44, top: 4, bottom: 4 }}
          barCategoryGap="15%"
          role="img"
          aria-label="Volumen por grupo muscular en barras horizontales"
        >
          <XAxis type="number" tick={axisTick(colors)} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="muscle"
            tick={{ fill: colors.muted, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={76}
            tickFormatter={(m: string) => MUSCLE_GROUP_LABELS[m] ?? m}
          />
          <Tooltip
            cursor={{ fill: colors.bgElevated }}
            contentStyle={tooltipStyle(colors)}
            labelStyle={{ color: colors.muted }}
            itemStyle={{ color: colors.fg }}
            formatter={(value) => [formatVolume(Number(value)), 'Volumen']}
          />
          <Bar dataKey="volume" radius={[0, 8, 8, 0]} maxBarSize={26}>
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
            <LabelList
              dataKey="volume"
              position="right"
              offset={8}
              formatter={(v) => formatVolume(Number(v))}
              style={{ fill: colors.fg, fontSize: 11, fontWeight: 500 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
