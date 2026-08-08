// Gráfico de velas OHLC (apertura/cierre/máx/mín) para rangos de carga, con vela SVG personalizada en Recharts.
import { ComposedChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useThemeColors, type ThemeColors } from '@/hooks/useThemeColors'
import { axisTick, tooltipStyle } from './chartStyle'

export interface CandleDatum {
  label: string
  open: number
  close: number
  high: number
  low: number
}

type CandleShapeProps = {
  x?: number
  y?: number
  width?: number
  height?: number
  payload?: CandleDatum
  colors: ThemeColors
}

/** Vela OHLC dibujada sobre la geometría que Recharts reserva para el valor `open` (baseline en 0). */
const CandleShape = ({ x = 0, y = 0, width = 0, height = 0, payload, colors }: CandleShapeProps) => {
  if (!payload || height <= 0) return null
  const { open, close, high, low } = payload
  const value = open || close || high || low
  if (value <= 0) return null

  const pxPerUnit = height / value
  const baselineY = y + height
  const yFor = (v: number) => baselineY - v * pxPerUnit
  const cx = x + width / 2
  const bodyW = Math.min(16, Math.max(5, width * 0.6))
  const up = close >= open
  const color = up ? colors.success : colors.danger
  const bodyTop = yFor(Math.max(open, close))
  const bodyBottom = yFor(Math.min(open, close))

  return (
    <g>
      <line x1={cx} y1={yFor(high)} x2={cx} y2={yFor(low)} stroke={color} strokeWidth={1.5} />
      <rect
        x={cx - bodyW / 2}
        y={bodyTop}
        width={bodyW}
        height={Math.max(1, bodyBottom - bodyTop)}
        fill={color}
        rx={1}
      />
    </g>
  )
}

type CandleTooltipProps = {
  active?: boolean
  payload?: Array<{ payload?: CandleDatum }>
  label?: string
  colors: ThemeColors
  formatValue: (v: number) => string
}

const CandleTooltip = ({ active, payload, label, colors, formatValue }: CandleTooltipProps) => {
  const datum = payload?.[0]?.payload
  if (!active || !datum) return null
  // Verde si el cierre subió respecto a la apertura, rojo si bajó (mismo criterio que el color de la vela).
  const up = datum.close >= datum.open
  return (
    <div style={tooltipStyle(colors)}>
      <p style={{ color: colors.muted, margin: '0 0 4px' }}>{label}</p>
      <p style={{ color: colors.fg, margin: 0 }}>
        Apertura {formatValue(datum.open)} · Cierre {formatValue(datum.close)}
      </p>
      <p style={{ color: colors.fg, margin: 0 }}>
        Máx {formatValue(datum.high)} · Mín {formatValue(datum.low)} ·{' '}
        {up ? '▲' : '▼'}
      </p>
    </div>
  )
}

type Props = {
  data: CandleDatum[]
  ariaLabel: string
  emptyText: string
  formatValue: (v: number) => string
}

// Renderiza las velas como barras Recharts cuya forma la pinta CandleShape (ver comentario de esa función).
export const CandlestickChart = ({ data, ariaLabel, emptyText, formatValue }: Props) => {
  const colors = useThemeColors()

  if (data.length === 0) {
    return <p className="py-4 text-center text-sm text-muted">{emptyText}</p>
  }

  // Techo del eje Y con margen del 5% sobre el máximo histórico del rango.
  const maxV = Math.max(...data.map((d) => d.high)) * 1.05

  return (
    <div role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data}>
          <XAxis dataKey="label" tick={axisTick(colors)} axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis
            domain={[0, maxV]}
            tick={axisTick(colors)}
            axisLine={false}
            tickLine={false}
            width={40}
            tickFormatter={formatValue}
          />
          <Tooltip content={<CandleTooltip colors={colors} formatValue={formatValue} />} />
          <Bar dataKey="open" shape={<CandleShape colors={colors} />} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
