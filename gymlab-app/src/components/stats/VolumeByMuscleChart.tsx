// Barras horizontales de volumen por grupo muscular, con paleta fija y etiquetas de volumen al final.
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LabelList } from 'recharts'
import { useThemeColors } from '@/hooks/useThemeColors'
import { axisTick, tooltipStyle } from './chartStyle'
import { formatVolume } from '@/domain/volume'
import { MUSCLE_GROUP_LABELS } from '@/domain/routines'
import type { MuscleVolume } from '@/domain/trainingStats'

type Props = {
  data: MuscleVolume[]
}

// Paleta cíclica: cada grupo muscular recibe el color de su índice (se repite si hay más grupos).
const PALETTE = ['#d9b384', '#b07f2e', '#22c55e', '#3b82f6', '#a855f7', '#ef4444', '#eab308', '#14b8a6', '#ec4899']

export const VolumeByMuscleChart = ({ data }: Props) => {
  const colors = useThemeColors()

  if (data.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted">
        Completa series con peso para ver tu volumen por grupo muscular.
      </p>
    )
  }

  // Alto proporcional al nº de grupos para que las barras no se aplasten con muchos datos.
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 40)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 8, right: 44 }}
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
          width={72}
          tickFormatter={(m: string) => MUSCLE_GROUP_LABELS[m] ?? m}
        />
        <Tooltip
          cursor={{ fill: colors.bgElevated }}
          contentStyle={tooltipStyle(colors)}
          labelStyle={{ color: colors.muted }}
          itemStyle={{ color: colors.fg }}
          formatter={(value) => [formatVolume(Number(value)), 'Volumen']}
        />
        <Bar dataKey="volume" radius={[0, 8, 8, 0]} maxBarSize={22}>
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
          <LabelList
            dataKey="volume"
            position="right"
            formatter={(v) => formatVolume(Number(v))}
            style={{ fill: colors.fg, fontSize: 11 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
